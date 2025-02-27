// BlackJack Game - Web Implementation
class Card {
    constructor(value, suit) {
        this.value = value;
        this.suit = suit;
    }

    toString() {
        return `${this.value}-${this.suit}`;
    }

    getValue() {
        if (["A", "J", "Q", "K"].includes(this.value)) {
            if (this.value === "A") return 11;
            return 10;
        }
        return parseInt(this.value);
    }

    isAce() {
        return this.value === "A";
    }

    getImagePath() {
        return `./cards/${this.toString()}.png`;
    }
}

class BlackJack {
    constructor() {
        // Game state
        this.deck = [];
        this.hiddenCard = null;
        this.dealerHand = [];
        this.dealerSum = 0;
        this.dealerAceCount = 0;
        this.numPlayers = 1;
        this.playerHands = [];
        this.playerSums = [];
        this.playerAceCounts = [];
        this.currentPlayer = 0;
        this.gameOver = false;
        this.imagesLoaded = false;

        // Card dimensions
        this.cardWidth = 130;
        this.cardHeight = 174;

        // Initialize canvas and buttons
        this.initializeUI();
        this.loadCardImages().then(() => {
            // Only start the game after images are loaded
            this.imagesLoaded = true;
            this.initializeGame();
        }).catch(error => {
            console.error("Error loading card images:", error);
            // Fallback to placeholder cards and continue
            this.createPlaceholderCards();
            this.imagesLoaded = true;
            this.initializeGame();
        });
    }

    initializeUI() {
        // Create canvas
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error("Canvas element not found!");
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.updateCanvasSize();
        
        // Set up event listeners
        window.addEventListener('resize', () => this.updateCanvasSize());
        
        // Set up buttons
        document.getElementById('hitButton')?.addEventListener('click', () => this.hit());
        document.getElementById('stayButton')?.addEventListener('click', () => this.stay());
        document.getElementById('newGameButton')?.addEventListener('click', () => this.initializeGame());
        
        // Disable buttons until images are loaded
        this.setButtonsEnabled(false);
        
        // Display loading message
        this.ctx.fillStyle = "#376E50";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = "24px Arial";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Loading game...", this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.textAlign = "left";
    }

    updateCanvasSize() {
        // Get container width
        const container = this.canvas.parentElement;
        const maxWidth = Math.min(window.innerWidth - 40, 1000);
        const maxHeight = Math.min(window.innerHeight - 200, 800);
        
        // Set canvas size preserving aspect ratio
        if (maxWidth / maxHeight > 4/3) {
            this.canvas.height = maxHeight;
            this.canvas.width = maxHeight * 4/3;
        } else {
            this.canvas.width = maxWidth;
            this.canvas.height = maxWidth * 3/4;
        }
        
        // Scale card size based on canvas size
        this.cardWidth = Math.min(130, this.canvas.width / 6);
        this.cardHeight = this.cardWidth * 1.34; // Maintain aspect ratio
        
        // Redraw if game is initialized
        if (this.imagesLoaded) {
            this.draw();
        }
    }

    setButtonsEnabled(enabled) {
        const hitButton = document.getElementById('hitButton');
        const stayButton = document.getElementById('stayButton');
        const newGameButton = document.getElementById('newGameButton');
        
        if (hitButton) hitButton.disabled = !enabled;
        if (stayButton) stayButton.disabled = !enabled;
        if (newGameButton) newGameButton.disabled = !enabled;
    }

    async loadCardImages() {
        // Create empty card images object
        this.cardImages = {};
        
        // Load card back
        const backImg = await this.loadImage('./cards/BACK.png');
        this.cardImages['BACK'] = backImg;
        
        // Load all cards
        const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        const suits = ["C", "D", "H", "S"];
        
        const loadPromises = [];
        
        for (const suit of suits) {
            for (const value of values) {
                const cardId = `${value}-${suit}`;
                loadPromises.push(
                    this.loadImage(`./cards/${cardId}.png`)
                        .then(img => {
                            this.cardImages[cardId] = img;
                        })
                        .catch(error => {
                            console.warn(`Failed to load card image for ${cardId}:`, error);
                            // Create fallback for this specific card
                            this.cardImages[cardId] = this.createCardPlaceholder(value, suit);
                        })
                );
            }
        }
        
        // Wait for all images to load
        return Promise.all(loadPromises);
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
            img.src = src;
        });
    }

    createPlaceholderCards() {
        // Create fallback cards if images fail to load
        this.cardImages = {};
        
        // Create backside
        this.cardImages['BACK'] = this.createCardPlaceholder("", "", true);
        
        // Create all cards
        const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        const suits = ["C", "D", "H", "S"];
        
        for (const suit of suits) {
            for (const value of values) {
                const cardId = `${value}-${suit}`;
                this.cardImages[cardId] = this.createCardPlaceholder(value, suit);
            }
        }
    }

    createCardPlaceholder(value, suit, isBack = false) {
        // Create an off-screen canvas to draw the card
        const cardCanvas = document.createElement('canvas');
        cardCanvas.width = 200;
        cardCanvas.height = 280;
        const ctx = cardCanvas.getContext('2d');
        
        // Card background
        ctx.fillStyle = isBack ? "#000080" : "white";
        ctx.fillRect(0, 0, 200, 280);
        
        // Card border
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, 190, 270);
        
        if (!isBack) {
            // Convert suit letter to symbol
            let suitSymbol = "";
            let color = "black";
            
            switch(suit) {
                case "H": 
                    suitSymbol = "♥"; 
                    color = "red";
                    break;
                case "D": 
                    suitSymbol = "♦"; 
                    color = "red";
                    break;
                case "C": 
                    suitSymbol = "♣"; 
                    break;
                case "S": 
                    suitSymbol = "♠"; 
                    break;
            }
            
            // Draw card value and suit
            ctx.fillStyle = color;
            ctx.font = "bold 50px Arial";
            ctx.textAlign = "center";
            ctx.fillText(value, 50, 70);
            
            ctx.font = "bold 80px Arial";
            ctx.fillText(suitSymbol, 50, 150);
            
            // Center symbol
            ctx.font = "bold 120px Arial";
            ctx.fillText(suitSymbol, 100, 170);
        } else {
            // Pattern for back of card
            ctx.fillStyle = "#4682B4";
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 7; j++) {
                    ctx.fillRect(20 + i * 40, 20 + j * 40, 20, 20);
                }
            }
        }
        
        // Convert to image
        const img = new Image();
        img.src = cardCanvas.toDataURL();
        return img;
    }

    initializeGame() {
        if (!this.imagesLoaded) {
            console.warn("Cannot start game: Images not loaded yet");
            return;
        }
        
        // Get number of players with validation
        let input = prompt("Enter number of players (1-6):", "1");
        this.numPlayers = parseInt(input) || 1;
        if (this.numPlayers < 1) this.numPlayers = 1;
        if (this.numPlayers > 6) this.numPlayers = 6;

        this.buildDeck();
        this.shuffleDeck();
        
        // Reset dealer
        this.dealerHand = [];
        this.dealerSum = 0;
        this.dealerAceCount = 0;

        // Deal hidden card
        this.hiddenCard = this.deck.pop();
        this.dealerSum += this.hiddenCard.getValue();
        this.dealerAceCount += this.hiddenCard.isAce() ? 1 : 0;
        
        // Deal visible card to dealer
        const card = this.deck.pop();
        this.dealerSum += card.getValue();
        this.dealerAceCount += card.isAce() ? 1 : 0;
        this.dealerHand.push(card);

        // Reset players
        this.playerHands = [];
        this.playerSums = [];
        this.playerAceCounts = [];
        this.currentPlayer = 0;
        
        // Deal cards to players
        for (let p = 0; p < this.numPlayers; p++) {
            const hand = [];
            let sum = 0;
            let aceCount = 0;
            
            for (let i = 0; i < 2; i++) {
                const c = this.deck.pop();
                sum += c.getValue();
                aceCount += c.isAce() ? 1 : 0;
                hand.push(c);
            }
            
            this.playerHands.push(hand);
            this.playerSums.push(sum);
            this.playerAceCounts.push(aceCount);
        }
        
        this.gameOver = false;
        this.setButtonsEnabled(true);
        
        // Check for player blackjacks
        let allBlackjack = true;
        for (let p = 0; p < this.numPlayers; p++) {
            if (this.playerHands[p].length === 2 && this.playerSums[p] === 21) {
                // This player has blackjack
            } else {
                allBlackjack = false;
            }
        }
        
        // If all players have blackjack, end the game
        if (allBlackjack) {
            this.gameOver = true;
            this.setButtonsEnabled(false);
            document.getElementById('hitButton').disabled = true;
            document.getElementById('stayButton').disabled = true;
        }
        
        this.draw();
        
        // Add screen reader announcement
        this.announceForScreenReader("New game started with " + this.numPlayers + " players");
    }

    announceForScreenReader(message) {
        // Create or update a live region for screen reader announcements
        let liveRegion = document.getElementById('game-announcer');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'game-announcer';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.classList.add('sr-only');
            liveRegion.style.position = 'absolute';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.padding = '0';
            liveRegion.style.margin = '-1px';
            liveRegion.style.overflow = 'hidden';
            liveRegion.style.clip = 'rect(0, 0, 0, 0)';
            liveRegion.style.whiteSpace = 'nowrap';
            liveRegion.style.border = '0';
            document.body.appendChild(liveRegion);
        }
        
        liveRegion.textContent = message;
    }

    hit() {
        if (this.gameOver) return;
        
        const card = this.deck.pop();
        const curSum = this.playerSums[this.currentPlayer] + card.getValue();
        const curAceCount = this.playerAceCounts[this.currentPlayer] + (card.isAce() ? 1 : 0);
        
        this.playerHands[this.currentPlayer].push(card);
        this.playerSums[this.currentPlayer] = curSum;
        this.playerAceCounts[this.currentPlayer] = curAceCount;

        // Announce card received
        this.announceForScreenReader(`Player ${this.currentPlayer + 1} received ${card.value} of ${this.getSuitName(card.suit)}. New total: ${this.reducePlayerAce(this.currentPlayer)}`);

        if (this.reducePlayerAce(this.currentPlayer) > 21) {
            this.announceForScreenReader(`Player ${this.currentPlayer + 1} busts!`);
            this.nextPlayer();
        }
        
        this.draw();
    }

    getSuitName(suitCode) {
        switch(suitCode) {
            case 'H': return 'Hearts';
            case 'D': return 'Diamonds';
            case 'C': return 'Clubs';
            case 'S': return 'Spades';
            default: return suitCode;
        }
    }

    stay() {
        if (this.gameOver) return;
        this.announceForScreenReader(`Player ${this.currentPlayer + 1} stands with ${this.reducePlayerAce(this.currentPlayer)}`);
        this.nextPlayer();
        this.draw();
    }

    nextPlayer() {
        this.currentPlayer++;
        if (this.currentPlayer >= this.numPlayers) {
            this.gameOver = true;
            document.getElementById('hitButton').disabled = true;
            document.getElementById('stayButton').disabled = true;
            
            // Check if any player hasn't busted
            let allBusted = true;
            for (let p = 0; p < this.numPlayers; p++) {
                if (this.reducePlayerAce(p) <= 21) {
                    allBusted = false;
                    break;
                }
            }
            
            // Only play dealer hand if at least one player hasn't busted
            if (!allBusted) {
                // Dealer plays
                this.announceForScreenReader("Dealer's turn. Hidden card is " + this.hiddenCard.value + " of " + this.getSuitName(this.hiddenCard.suit));
                
                while (this.reduceDealerAce() < 17 && this.deck.length > 0) {
                    const card = this.deck.pop();
                    this.dealerSum += card.getValue();
                    this.dealerAceCount += card.isAce() ? 1 : 0;
                    this.dealerHand.push(card);
                    this.announceForScreenReader("Dealer draws " + card.value + " of " + this.getSuitName(card.suit));
                }
                
                this.announceForScreenReader("Dealer's final score: " + this.reduceDealerAce());
            } else {
                this.announceForScreenReader("All players busted. Dealer wins!");
            }
            
            // Announce final results
            this.announceGameResults();
        } else {
            this.announceForScreenReader(`Player ${this.currentPlayer + 1}'s turn`);
        }
    }

    announceGameResults() {
        let results = "Game over. Results: ";
        
        for (let p = 0; p < this.numPlayers; p++) {
            const finalSum = this.reducePlayerAce(p);
            let result = "";
            
            if (finalSum > 21) {
                result = "Bust";
            } else if (this.dealerSum > 21) {
                result = "Win";
            } else if (finalSum === this.dealerSum) {
                result = "Tie";
            } else if (finalSum > this.dealerSum) {
                result = "Win";
            } else {
                result = "Lose";
            }
            
            results += `Player ${p + 1}: ${result} (${finalSum}). `;
        }
        
        this.announceForScreenReader(results);
    }

    buildDeck() {
        this.deck = [];
        const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        const suits = ["C", "D", "H", "S"];
        
        for (const suit of suits) {
            for (const value of values) {
                this.deck.push(new Card(value, suit));
            }
        }
    }

    shuffleDeck() {
        // Fisher-Yates shuffle
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    reducePlayerAce(playerIndex) {
        let sum = this.playerSums[playerIndex];
        let aceCount = this.playerAceCounts[playerIndex];
        
        while (sum > 21 && aceCount > 0) {
            sum -= 10;
            aceCount--;
        }
        
        this.playerSums[playerIndex] = sum;
        this.playerAceCounts[playerIndex] = aceCount;
        return sum;
    }

    reduceDealerAce() {
        while (this.dealerSum > 21 && this.dealerAceCount > 0) {
            this.dealerSum -= 10;
            this.dealerAceCount--;
        }
        return this.dealerSum;
    }

    draw() {
        if (!this.imagesLoaded) return;
        
        // Clear canvas
        this.ctx.fillStyle = "#376E50"; // Green background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Calculate card spacing based on canvas size
        const cardSpacing = Math.min(20, this.canvas.width / 40);
        
        // Draw dealer's hand label
        this.ctx.font = `${Math.max(16, this.canvas.width / 40)}px Arial`;
        this.ctx.fillStyle = "white";
        this.ctx.fillText("Dealer's Hand", 20, 35);

        // Draw dealer's hidden card
        let hiddenCardImg = this.cardImages['BACK'];
        if (this.gameOver) {
            hiddenCardImg = this.cardImages[this.hiddenCard.toString()];
        }
        this.ctx.drawImage(hiddenCardImg, 20, 40, this.cardWidth, this.cardHeight);

        // Draw dealer's visible cards
        for (let i = 0; i < this.dealerHand.length; i++) {
            const card = this.dealerHand[i];
            const x = 20 + this.cardWidth + cardSpacing + (this.cardWidth + cardSpacing) * i;
            // Limit shown cards
            if (x + this.cardWidth > this.canvas.width - 20) break;
            
            const cardImg = this.cardImages[card.toString()];
            this.ctx.drawImage(cardImg, x, 40, this.cardWidth, this.cardHeight);
        }

        // Display dealer's score if game is over
        if (this.gameOver) {
            this.ctx.fillStyle = "white";
            this.ctx.fillText(`Score: ${this.dealerSum}`, 20, 40 + this.cardHeight + 20);
        }

        // Calculate layout based on number of players
        const playerSections = this.calculatePlayerLayout();
        
        // Draw player hands
        for (let p = 0; p < this.numPlayers; p++) {
            const section = playerSections[p];
            const hand = this.playerHands[p];
            
            // Draw player label
            const label = `Player ${p + 1}${p === this.currentPlayer && !this.gameOver ? " (Your Turn)" : ""}`;
            this.ctx.font = `bold ${Math.max(16, this.canvas.width / 40)}px Arial`;
            this.ctx.fillStyle = "white";
            this.ctx.fillText(label, section.x, section.y);
            
            // Calculate card offset to center the hand
            const maxVisibleCards = Math.min(hand.length, Math.floor((section.width - this.cardWidth) / (this.cardWidth/2) + 1));
            const totalWidth = this.cardWidth + (maxVisibleCards - 1) * (this.cardWidth/2);
            const startX = section.x + (section.width - totalWidth) / 2;
            
            // Draw cards with overlap
            for (let i = 0; i < hand.length; i++) {
                if (i >= maxVisibleCards) break;
                
                const x = startX + (this.cardWidth/2) * i;
                const cardImg = this.cardImages[hand[i].toString()];
                this.ctx.drawImage(cardImg, x, section.y + 10, this.cardWidth, this.cardHeight);
            }
            
            // Show card count if not all cards visible
            if (hand.length > maxVisibleCards) {
                this.ctx.fillStyle = "yellow";
                this.ctx.fillText(`+${hand.length - maxVisibleCards} more`, section.x + section.width - 50, section.y + 25);
            }

            // Display player's score
            const finalSum = this.reducePlayerAce(p);
            this.ctx.fillStyle = "white";
            this.ctx.fillText(`Score: ${finalSum}`, section.x, section.y + this.cardHeight + 20);

            // Display result if game is over
            if (this.gameOver) {
                let result = "";
                if (finalSum > 21) {
                    result = "Bust";
                } else if (this.dealerSum > 21) {
                    result = "Win";
                } else if (finalSum === this.dealerSum) {
                    result = "Tie";
                } else if (finalSum > this.dealerSum) {
                    result = "Win";
                } else {
                    result = "Lose";
                }
                this.ctx.font = `bold ${Math.max(14, this.canvas.width / 50)}px Arial`;
                this.ctx.fillStyle = result === "Win" ? "#FFFF00" : result === "Bust" || result === "Lose" ? "#FF6347" : "#FFFFFF";
                this.ctx.fillText(`Result: ${result}`, section.x + section.width - 100, section.y + 25);
            }
        }
        
        // Display deck count
        this.ctx.font = `${Math.max(14, this.canvas.width / 50)}px Arial`;
        this.ctx.fillStyle = "white";
        this.ctx.fillText(`Cards in deck: ${this.deck.length}`, 20, this.canvas.height - 20);
    }

    calculatePlayerLayout() {
        const sections = [];
        const padding = 20;
        const dealerSection = 40 + this.cardHeight + 40; // Height reserved for dealer
        
        // Available height for player sections
        const availableHeight = this.canvas.height - dealerSection - padding;
        
        // Calculate rows and columns based on player count
        let rows = 1;
        let cols = this.numPlayers;
        
        if (this.numPlayers > 3) {
            rows = 2;
            cols = Math.ceil(this.numPlayers / 2);
        }
        
        // Calculate section dimensions
        const sectionHeight = availableHeight / rows;
        const sectionWidth = (this.canvas.width - (padding * 2)) / cols;
        
        // Create section for each player
        for (let p = 0; p < this.numPlayers; p++) {
            const row = Math.floor(p / cols);
            const col = p % cols;
            
            sections.push({
                x: padding + col * sectionWidth,
                y: dealerSection + row * sectionHeight,
                width: sectionWidth,
                height: sectionHeight
            });
        }
        
        return sections;
    }
}

// Initialize the game when the page loads
window.onload = function() {
    const game = new BlackJack();
};
