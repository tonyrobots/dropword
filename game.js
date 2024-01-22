document.addEventListener("DOMContentLoaded", () => {
  // globals
  const visibleRows = 6; // Number of rows visible on the screen

  const wordLength = 5;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let grid = [];
  let wordlist = [];
  let completedWords = [];
  let currentSelection = [];

  loadWordList("wordlist_5").then((words) => {
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
    console.log(`${wordlist.length} words loaded`);
    // addRowsToGrid(visibleRows); // add a bank of rows to grid to drop in as words are removed
  }

  // start game
  function startGame() {
    // Logic to start game
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
        cellDiv.addEventListener("click", () =>
          selectLetter(rowIndex, colIndex, cell)
        );
        rowDiv.appendChild(cellDiv);
      });
      gameContainer.appendChild(rowDiv);
    });
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
    let grid = Array.from({ length: 6 }, () => new Array(5).fill(""));
    for (let col = 0; col < 5; col++) {
      // For each column
      let availableRows = [0, 1, 2, 3, 4, 5];
      for (let word of words) {
        // For each word
        let letter = word[col];
        let randomRowIndex = availableRows.splice(
          Math.floor(Math.random() * availableRows.length),
          1
        )[0];
        grid[randomRowIndex][col] = letter;
      }
    }
    console.log("generated grid:", grid);
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
    console.log("wordlist length:", wordlist.length);
    if (wordlist.includes(word)) {
      completedWords.push(word);
      updateGrid(); // This will eventually clear the selection
    } else {
      alert("Not a valid word!");
      clearSelection(); // Clear the selection immediately for invalid word
    }
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
    // Step 1: Apply disappearing animation
    currentSelection.forEach((sel) => {
      const cellDiv = getCellDiv(sel.rowIndex, sel.colIndex);
      cellDiv.classList.add("disappearing");
    });

    // Step 2: Update grid data after disappearing animation completes
    setTimeout(() => {
      updateGridData();

      // Step 3: Apply falling animation
      applyFallingAnimation();

      // Step 4: Re-render grid after falling animation completes
      setTimeout(() => {
        renderGrid(grid);
        resetCellClasses();
        clearSelection(); // Now clear the selection
      }, 500); // match this with the falling animation duration
    }, 500); // match this with the disappearing animation duration
  }

  function updateGridData() {
    // Replenish the  filler rows if necessary
    if (grid.length < visibleRows + 1) {
      addRowsToGrid(visibleRows);
    }

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
  }

  function applyFallingAnimation() {
    grid.forEach((row, rowIndex) => {
      if (rowIndex < visibleRows) {
        // Ensure we only target visible rows
        row.forEach((cell, colIndex) => {
          const cellDiv = getCellDiv(rowIndex, colIndex);
          if (cellDiv && cellDiv.textContent !== cell) {
            cellDiv.classList.add("falling");
          }
        });
      }
    });
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
