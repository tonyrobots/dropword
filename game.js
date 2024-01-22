import * as Ui from "./uiHandling.js";

document.addEventListener("DOMContentLoaded", () => {
  // globals
  const visibleRows = 6; // Number of rows visible on the screen

  const wordLength = 5;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let grid = [];
  let wordlist = [];
  let completedWords = [];
  let currentSelection = [];

  loadWordList("sgb-words").then((words) => {
    wordlist = words;
    const selectedWords = selectWords(wordlist, visibleRows);
    grid = generateGrid(selectedWords);
    renderGrid(grid);
    console.log(selectedWords);
    initializeGame();
    startGame();
  });

  function initializeGame() {
    // Logic to initialize game
    addRowsToGrid(4); // add a bank of rows to grid to drop in as words are removed
  }

  // start game
  function startGame() {
    // Logic to start game
    // might not need this function
    gameLoop();
  }

  function gameLoop() {
    //update score
    document.getElementById("score").innerHTML = completedWords.length;
    //update valid words
    document.getElementById("valid-words").innerHTML = countValidWordsInGrid();
    //update found words list
    document.getElementById("found-words").innerHTML =
      completedWords.join("<br /> ");
  }

  function loadWordList(filename) {
    return fetch(`words/${filename}.txt`)
      .then((response) => response.text())
      .then((text) => text.split("\n").map((word) => word.trim().toUpperCase()))
      .catch((error) => console.error("Failed to load word list:", error));
  }

  function renderGrid(grid) {
    console.log("rows in grid:", grid.length);

    const gameContainer = document.getElementById("game-container");
    gameContainer.innerHTML = ""; // Clear previous grid
    let onscreenGrid = grid.slice(0, visibleRows); // Only render the visible rows
    onscreenGrid.forEach((row, rowIndex) => {
      let rowDiv = document.createElement("div");
      rowDiv.className = "grid-row";
      row.forEach((cell, colIndex) => {
        let cellDiv = document.createElement("div");
        cellDiv.className = "grid-cell";
        cellDiv.textContent = cell;
        if (cell === "?") {
          cellDiv.classList.add("wildcard");
        }
        cellDiv.addEventListener("click", () =>
          selectLetter(rowIndex, colIndex, cell)
        );
        rowDiv.appendChild(cellDiv);
      });
      gameContainer.appendChild(rowDiv);
    });
    // console.log("Number of valid words in the grid:", countValidWordsInGrid());
    console.log("Valid words in the grid:", findValidWordsInGrid());
    // console.log(grid);
  }

  function selectWords(wordlist, count) {
    let selected = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * wordlist.length);
      selected.push(wordlist[randomIndex]);
    }
    return selected;
  }

  function generateGrid(words) {
    // Determine the number of rows based on the number of words
    let numRows = words.length;
    let grid = Array.from({ length: numRows }, () => new Array(5).fill(""));

    const wildcardPct = 0.05; // percent chance a letter will be a wildcard

    // For each column, distribute the letters across random rows
    for (let col = 0; col < 5; col++) {
      // Extract the letter for this column from each word
      let columnLetters = words.map((word) => word[col] || ""); // Use an empty string if the letter doesn't exist

      // Shuffle the letters to randomize their positions
      let shuffledLetters = shuffleArray(columnLetters);

      // Assign the shuffled letters to the grid
      for (let row = 0; row < numRows; row++) {
        // Check if this letter should be a wildcard
        if (Math.random() < wildcardPct) {
          grid[row][col] = "?";
        } else {
          grid[row][col] = shuffledLetters[row];
        }
      }
    }

    return grid;
  }

  function addRowsToGrid(numRows) {
    const newRows = generateGrid(selectWords(wordlist, numRows));
    grid = grid.concat(newRows);
    console.log("added rows to grid:", newRows.length);
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
  }

  function selectLetter(rowIndex, colIndex, letter) {
    // Check if this specific cell is already selected
    const existingSelectionIndex = currentSelection.findIndex(
      (sel) => sel.colIndex === colIndex && sel.rowIndex === rowIndex
    );

    if (existingSelectionIndex !== -1) {
      // The cell is already selected - deselect it
      toggleCellSelection(rowIndex, colIndex, false);
      currentSelection.splice(existingSelectionIndex, 1);
      return; // Exit the function as no new cell is being selected
    }

    // Check if another letter in this column is already selected
    const existingColumnSelectionIndex = currentSelection.findIndex(
      (sel) => sel.colIndex === colIndex
    );

    if (existingColumnSelectionIndex !== -1) {
      // Deselect the previously selected cell in this column
      toggleCellSelection(
        currentSelection[existingColumnSelectionIndex].rowIndex,
        currentSelection[existingColumnSelectionIndex].colIndex,
        false
      );
      // Remove the existing selection from this column
      currentSelection.splice(existingColumnSelectionIndex, 1);
    }

    // Insert the new selection at the correct position
    currentSelection.splice(colIndex, 0, { rowIndex, colIndex, letter });

    // Select the new cell
    toggleCellSelection(rowIndex, colIndex, true);

    // Sort the current selection by column index
    currentSelection.sort((a, b) => a.colIndex - b.colIndex);

    // Check if a complete word is formed
    if (currentSelection.length === wordLength) {
      // validate word after 200ms
      setTimeout(() => {
        validateWord(currentSelection.map((sel) => sel.letter).join(""));
      }, 200);
    }
  }

  function validateWord(word) {
    console.log("Validating word:", word);
    // Check if the word contains a wildcard
    if (word.includes("?")) {
      // Find the first word in the wordlist that matches the pattern
      const matchingWord = findMatchingWordWithWildcard(word);
      if (matchingWord) {
        // Replace the wildcard with the correct letter
        word = matchingWord;
      }
    }
    if (wordlist.includes(word)) {
      completedWords.push(word);
      updateGrid(); // This will eventually clear the selection
    } else {
      Ui.displayMessage("Not a valid word!", true);
      clearSelection(); // Clear the selection immediately for invalid word
    }
  }

  function findMatchingWordWithWildcard(word) {
    let regexPattern = word.replace(/\?/g, "."); // Replace wildcard with regex dot
    let regex = new RegExp("^" + regexPattern + "$", "i");

    // Find the first word in the wordlist that matches the pattern
    return wordlist.find((word) => regex.test(word));
  }

  function findValidWordsInGrid() {
    let validWords = [];

    wordlist.forEach((word) => {
      if (canFormWordInGrid(word)) {
        validWords.push(word);
      }
    });

    return validWords;
  }
  function countValidWordsInGrid() {
    let validWords = findValidWordsInGrid();
    return validWords.length;
  }

  function canFormWordInGrid(word) {
    for (let col = 0; col < wordLength; col++) {
      let letterFoundInColumn = false;
      for (let row = 0; row < 6; row++) {
        // The letter matches or the cell contains a wildcard
        if (grid[row][col] === word[col] || grid[row][col] === "?") {
          letterFoundInColumn = true;
          break;
        }
      }
      // If no matching letter or wildcard was found in the column, the word can't be formed
      if (!letterFoundInColumn) return false;
    }
    return true;
  }

  function clearSelection() {
    // Clear the visual selection
    currentSelection.forEach((sel) => {
      toggleCellSelection(sel.rowIndex, sel.colIndex, false); // Deselect the cell
    });

    // Reset the current selection
    currentSelection = [];
  }

  function toggleCellSelection(rowIndex, colIndex, isSelected) {
    const cellDiv = document.querySelector(
      `.grid-row:nth-child(${rowIndex + 1}) .grid-cell:nth-child(${
        colIndex + 1
      })`
    );
    if (cellDiv) {
      if (isSelected) {
        cellDiv.classList.add("selected");
      } else {
        cellDiv.classList.remove("selected");
      }
    }
  }

  function updateGrid() {
    const oldGrid = JSON.parse(JSON.stringify(grid)); // Deep copy of grid

    // Step 1: Apply disappearing animation
    currentSelection.forEach((sel) => {
      const cellDiv = getCellDiv(sel.rowIndex, sel.colIndex);
      cellDiv.classList.add("disappearing");
    });

    // Step 2: Update grid data after disappearing animation completes
    setTimeout(() => {
      updateGridData();

      // Step 3: Apply falling animation
      applyFallingAnimation(oldGrid);

      // Step 4: Re-render grid after falling animation completes
      setTimeout(() => {
        renderGrid(grid);
        resetCellClasses();
        clearSelection(); // Now clear the selection
        gameLoop(); // do anything else that should happen each time the grid is updated
      }, 500); // match this with the falling animation duration
    }, 500); // match this with the disappearing animation duration
  }

  function updateGridData() {
    // Shift letters down in each column of the visible part
    currentSelection.forEach((sel) => {
      for (let row = sel.rowIndex; row > 0; row--) {
        grid[row][sel.colIndex] = grid[row - 1][sel.colIndex];
      }
      // Pull a letter from the first filler row into the top visible row
      grid[0][sel.colIndex] = grid[6][sel.colIndex];
    });

    // Shift the filler part of the grid down
    for (let row = 6; row < grid.length - 1; row++) {
      for (let col = 0; col < 5; col++) {
        grid[row][col] = grid[row + 1][col];
      }
    }

    // pop the last item in the grid since it's been copied down
    grid.pop();

    // Replenish the filler rows if necessary
    if (grid.length < visibleRows + 3) {
      addRowsToGrid(3);
    }
  }

  function applyFallingAnimation(oldGrid) {
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < visibleRows; row++) {
        // Get the cell div in the current grid
        const cellDiv = getCellDiv(row, col);

        // Check if the cell content has changed position
        if (cellDiv && oldGrid[row][col] !== grid[row][col]) {
          cellDiv.classList.add("falling");
        }
      }
    }
  }

  function resetCellClasses() {
    document.querySelectorAll(".grid-cell").forEach((cell) => {
      cell.classList.remove("selected", "falling", "disappearing");
    });
  }

  function getCellDiv(rowIndex, colIndex) {
    return document.querySelector(
      `.grid-row:nth-child(${rowIndex + 1}) .grid-cell:nth-child(${
        colIndex + 1
      })`
    );
  }
});
