import * as Ui from "./uiHandling.js";

document.addEventListener("DOMContentLoaded", () => {
  // globals
  const visibleRows = 5; // Number of rows visible on the screen
  const wordLength = 5;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const gameTime = 120; // game length in seconds
  const timeAddedPerWord = 10; // seconds added to the timer per word found
  const wcChar = "⭐️"; // wildcard character

  // dom objects
  const helpModal = document.getElementById("helpModal");
  const startButton = document.getElementById("start-button");
  const gridElement = document.getElementById("grid");
  const contentArea = document.getElementById("content-area");
  const wordConstructionDiv = document.getElementById("word-construction");

  let grid = [];
  let fillerGrid = [];
  let wordlist = [];
  let completedWords = [];
  let currentSelection = [];
  let focusCol = 0;
  let timeRemaining = gameTime;
  let timerInterval;
  let gameOver = true;

  startButton.addEventListener("click", startGame);
  // add keyboard support for letter selection
  document.addEventListener("keydown", (event) => {
    handleKeydown(event);
  });

  loadWordList("sgb-words").then((words) => {
    wordlist = words;
    // show start button
    startButton.textContent = "Let's Go!";
    startButton.style.display = "block";
  });

  // generate and render empty grid
  grid = generateGrid(
    ["?????", "?????", "?????", "?????", "?????", "?????"],
    true
  );
  renderGrid(grid);

  gridElement.style.opacity = 0.5;

  function initializeGame() {
    // Logic to initialize game
    addRowsToFillerGrid(4); // add a bank of rows to filler grid to drop in as words are removed
    timeRemaining = gameTime;
    focusCol = 0;
    completedWords = [];
    document.getElementById("missed-words-container").style.display = "none";
    document.getElementById("found-words-container").style.display = "none";
  }

  function startGame() {
    gameOver = false;

    const selectedWords = chooseWords(wordlist, visibleRows);
    grid = generateGrid(selectedWords);
    renderGrid(grid);
    console.log(selectedWords);
    // hide start button
    startButton.style.display = "none";
    gridElement.style.opacity = 1;

    initializeGame();
    startTimer();
    gameLoop();
  }

  function gameLoop() {
    //update score
    document.getElementById("score").innerHTML = completedWords.length;
    //update valid words
    let validWordsCount = countValidWordsInGrid();
    document.getElementById("valid-words").innerHTML = validWordsCount;

    //update found words list
    document.getElementById("found-words").innerHTML =
      completedWords.join("<br /> ");

    // if no valid words left, game over!
    if (validWordsCount === 0) {
      endGame("There are no words left!");
      return;
    }
  }

  function startTimer() {
    // show grid and wordconstruction again, hide content area
    // Ui.setVisibilityByClass("grid-cell", true, "flex");
    gridElement.style.visibility = "visible";
    wordConstructionDiv.style.visibility = "visible ";

    // remove event listener from timer
    document
      .getElementById("timer-container")
      .removeEventListener("click", startTimer);
    // add event listener to pause game
    document
      .getElementById("timer-container")
      .addEventListener("click", pauseGame);

    // hide content area
    contentArea.style.display = "none";

    // start timer

    timerInterval = setInterval(() => {
      if (timeRemaining === 0) {
        endGame();
        return;
      }

      timeRemaining--;
      updateTimerDisplay();
    }, 1000);
  }

  function pauseGame() {
    if (gameOver) return;
    clearInterval(timerInterval);
    // hide/show stuff
    // Ui.setVisibilityByClass("grid-cell", false);
    gridElement.style.visibility = "hidden";
    wordConstructionDiv.style.visibility = "hidden";
    contentArea.style.display = "flex";

    contentArea.textContent = "Game Paused. Press timer to resume.";
    // Ui.displayMessage("Game paused, press timer again to resume.");

    // remove event listener for pause
    document
      .getElementById("timer-container")
      .removeEventListener("click", pauseGame);
    // add event listener to resume game
    document
      .getElementById("timer-container")
      .addEventListener("click", startTimer);
  }

  function updateTimerDisplay() {
    let timeRemainingDisplay = Math.max(timeRemaining, 0); // Don't allow negative time
    const minutes = Math.floor(timeRemainingDisplay / 60);
    const seconds = timeRemainingDisplay % 60;
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    const timerElement = document.getElementById("timer");
    timerElement.textContent = formattedTime;
    if (timeRemaining < 15) {
      timerElement.parentElement.classList.add("alert");
    } else {
      timerElement.parentElement.classList.remove("alert");
    }
  }

  function addTime(seconds) {
    timeRemaining += seconds;
    // Make sure the timer display is updated immediately after adding time
    updateTimerDisplay();
  }

  function endGame(message = "Time's up!") {
    gameOver = true;
    clearInterval(timerInterval);
    const timerElement = document.getElementById("timer");
    timerElement.textContent = "💀";
    timerElement.parentElement.classList.remove("alert");
    clearWordConstruction();
    clearSelection();

    timeRemaining = 0;
    if (completedWords.length > 15) {
      Ui.triggerConfetti();
    }
    Ui.displayMessage(
      message + " You found " + completedWords.length + " words."
    );

    // Populate missed words
    let validWordsCount = countValidWordsInGrid();
    if (validWordsCount > 0) {
      const missedWords = findValidWordsInGrid(10); // Implement this function to get missed words
      const missedWordsList = document.getElementById("missed-words");
      missedWords.forEach((word) => {
        missedWordsList.innerHTML += `<div>${word}</div>`;
      });
      if (validWordsCount > 10) {
        missedWordsList.innerHTML += `<div>and ${
          validWordsCount - 10
        } more</div>`;
      }
    }
    document.getElementById("found-words-container").style.display = "block";
    document.getElementById("missed-words-container").style.display = "block";
    // hide grid and wordconstruction -- there should be a nicer way to handle this
    // make grid 30% opacity
    gridElement.style.opacity = 0.3;
    // gridElement.style.visibility = "hidden";
    // contentArea.style.visibility = "visible";
    wordConstructionDiv.style.visibility = "hidden";

    // show start button after 3 seconds
    setTimeout(() => {
      startButton.style.display = "block";
      startButton.textContent = "One more time!";
    }, 3000);
  }

  function loadWordList(filename) {
    return fetch(`words/${filename}.txt`)
      .then((response) => response.text())
      .then((text) => text.split("\n").map((word) => word.trim().toUpperCase()))
      .catch((error) => console.error("Failed to load word list:", error));
  }

  function renderGrid(grid) {
    console.log("rows in grid:", grid.length);

    const gridContainer = document.getElementById("grid");

    gridContainer.innerHTML = ""; // Clear previous grid
    let onscreenGrid = grid.slice(0, visibleRows); // Only render the visible rows
    onscreenGrid.forEach((row, rowIndex) => {
      let rowDiv = document.createElement("div");
      rowDiv.className = "grid-row";
      row.forEach((cell, colIndex) => {
        let cellDiv = document.createElement("div");
        cellDiv.className = "grid-cell";
        cellDiv.textContent = cell;
        if (cell === wcChar) {
          cellDiv.classList.add("wildcard");
        }
        cellDiv.addEventListener("click", () =>
          selectLetter(rowIndex, colIndex, cell)
        );
        rowDiv.appendChild(cellDiv);
      });
      gridContainer.appendChild(rowDiv);
    });
    // console.log("Number of valid words in the grid:", countValidWordsInGrid());
    console.log("Valid words in the grid:", findValidWordsInGrid());
    // console.log(grid);
  }

  function chooseWords(wordlist, count) {
    let selected = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * wordlist.length);
      selected.push(wordlist[randomIndex]);
    }
    return selected;
  }

  function generateGrid(words, empty = false) {
    // Determine the number of rows based on the number of words
    let numRows = words.length;
    let grid = Array.from({ length: numRows }, () => new Array(5).fill(""));

    const wildcardPct = 0.04; // percent chance a letter will be a wildcard

    // For each column, distribute the letters across random rows
    for (let col = 0; col < 5; col++) {
      // Extract the letter for this column from each word
      let columnLetters = words.map((word) => word[col] || ""); // Use an empty string if the letter doesn't exist

      // Shuffle the letters to randomize their positions
      let shuffledLetters = shuffleArray(columnLetters);

      // Assign the shuffled letters to the grid
      for (let row = 0; row < numRows; row++) {
        // Check if this letter should be a wildcard
        if (Math.random() < wildcardPct && !empty) {
          grid[row][col] = wcChar;
        } else {
          grid[row][col] = shuffledLetters[row];
        }
      }
    }

    return grid;
  }

  function addRowsToFillerGrid(numRows) {
    const newRows = generateGrid(chooseWords(wordlist, numRows));
    fillerGrid = fillerGrid.concat(newRows);
    console.log("added rows to filler grid:", newRows.length);
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
  }

  function handleKeydown(e) {
    if (gameOver) return;

    // only accept letters and backspace
    if (!alphabet.includes(e.key.toUpperCase()) && e.key !== "Backspace")
      return;

    // if a matching letter is in the focus column, select the first match
    const letter = e.key.toUpperCase();

    // handle backspace
    if (e.key === "Backspace") {
      clearSelection();
      return;
    }
    const col = focusCol;

    const row = grid.findIndex((row) => row[col] === letter);
    if (row !== -1) {
      selectLetter(row, col, letter);
    } else {
      // if no matching letter is in the focus column, select the first wildcard
      const row = grid.findIndex((row) => row[col] === wcChar);
      if (row !== -1) {
        selectLetter(row, col, wcChar);
      }
    }
  }

  function selectLetter(rowIndex, colIndex, letter) {
    // Check if the game is over
    if (gameOver) return;

    // Check if this specific cell is already selected
    const existingSelectionIndex = currentSelection.findIndex(
      (sel) => sel.colIndex === colIndex && sel.rowIndex === rowIndex
    );

    if (existingSelectionIndex !== -1) {
      // The cell is already selected - deselect it
      toggleCellSelection(rowIndex, colIndex, false);
      currentSelection.splice(existingSelectionIndex, 1);
      // set focus to this column
      focusCol = colIndex;
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
    // animateLetterToWord(rowIndex, colIndex, letter);
    addLetterToWordConstruction(colIndex, letter);

    // move focus to selected column + 1
    focusCol = (colIndex + 1) % wordLength;

    // Sort the current selection by column index
    currentSelection.sort((a, b) => a.colIndex - b.colIndex);

    // Check if a complete word is formed
    if (currentSelection.length === wordLength) {
      // validate word after a delay
      setTimeout(() => {
        validateWord(currentSelection.map((sel) => sel.letter).join(""));
      }, 300);
    }
  }

  function validateWord(word) {
    console.log("Validating word:", word);
    // Check if the word contains a wildcard
    if (word.includes(wcChar)) {
      // Find the first word in the wordlist that matches the pattern
      const matchingWord = findMatchingWordWithWildcard(word);
      if (matchingWord) {
        // Replace the wildcard with the correct letter
        word = matchingWord;
        // replace word in word construction with correct word
        for (let i = 0; i < word.length; i++) {
          addLetterToWordConstruction(i, word[i]);
        }
      }
    }
    if (wordlist.includes(word)) {
      completedWords.push(word);
      addTime(timeAddedPerWord);
      animateWordConstructionSuccess();
      updateGrid(); // This will eventually clear the selection
    } else {
      Ui.displayMessage("nope", true);
      animateWordConstructionFailure(); // this will also clear the selection/construction area
    }
  }

  function findMatchingWordWithWildcard(word) {
    let regexPattern = word.replaceAll(wcChar, "."); // Replace wildcard with regex dot
    let regex = new RegExp("^" + regexPattern + "$", "i");

    // Find the first word in the wordlist that matches the pattern
    return wordlist.find((word) => regex.test(word));
  }

  function findValidWordsInGrid(limit = 0) {
    let validWords = [];

    let count = 0;

    //check each word in the wordlist to see if it's in the grid
    for (let i = 0; i < wordlist.length; i++) {
      if (canFormWordInGrid(wordlist[i])) {
        validWords.push(wordlist[i]);
        count++;
        if (limit > 0 && count >= limit) break;
      }
    }
    return validWords;
  }

  function countValidWordsInGrid() {
    let validWords = findValidWordsInGrid();
    return validWords.length;
  }

  function canFormWordInGrid(word) {
    for (let col = 0; col < wordLength; col++) {
      let letterFoundInColumn = false;
      for (let row = 0; row < visibleRows; row++) {
        // The letter matches or the cell contains a wildcard
        if (grid[row][col] === word[col] || grid[row][col] === wcChar) {
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
    focusCol = 0;
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
        removeLetterBlock(colIndex); // Remove the letter block from the word construction area
      }
    }
  }

  function updateGrid() {
    let disappearingRowIndices = [];
    // Step 1: Apply disappearing animation to selected cells
    currentSelection.forEach((sel) => {
      const cellDiv = getCellDiv(sel.rowIndex, sel.colIndex);
      cellDiv.classList.add("disappearing");
      disappearingRowIndices.push(sel.rowIndex);
    });

    // Step 2: Update grid data after disappearing animation completes
    setTimeout(() => {
      updateGridData();

      // Step 3: Apply falling animation
      applyFallingAnimation(disappearingRowIndices);

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
      grid[0][sel.colIndex] = fillerGrid[0][sel.colIndex];
    });

    // Shift the filler grid down
    for (let row = 0; row < fillerGrid.length - 1; row++) {
      for (let col = 0; col < 5; col++) {
        fillerGrid[row][col] = fillerGrid[row + 1][col];
      }
    }

    // pop the last item in the fillergrid since it's been copied down
    fillerGrid.pop();

    // Replenish the filler rows if necessary
    if (fillerGrid.length < 3) {
      addRowsToFillerGrid(3);
    }
  }

  function applyFallingAnimation(disappearingRowIndices) {
    for (let col = 0; col < wordLength; col++) {
      for (let row = 0; row < visibleRows; row++) {
        // Get the cell div in the current grid
        const cellDiv = getCellDiv(row, col);

        // Check if the cell is above the disappearing cells for this column
        if (cellDiv && disappearingRowIndices[col] > row) {
          cellDiv.classList.add("falling");
          cellDiv.style.transform = `translateY(${cellDiv.offsetHeight}px)`;
        }
      }
    }
  }

  function resetCellClasses() {
    document.querySelectorAll(".grid-cell").forEach((cell) => {
      cell.classList.remove(
        "selected",
        "falling",
        "disappearing",
        "moving-letter"
      );
    });
  }

  function getCellDiv(rowIndex, colIndex) {
    return document.querySelector(
      `.grid-row:nth-child(${rowIndex + 1}) .grid-cell:nth-child(${
        colIndex + 1
      })`
    );
  }

  function addLetterToWordConstruction(colIndex, letter) {
    const wordConstructionDiv = document.getElementById("word-construction");
    const wordConstructionSlot = document.getElementById(
      `slot-${colIndex + 1}`
    );
    wordConstructionSlot.innerHTML = letter;
  }

  function removeLetterBlock(col) {
    const wordConstructionSlot = document.getElementById(`slot-${col + 1}`);
    // wordConstructionSlot.classList.add("disappearing");
    wordConstructionSlot.innerHTML = "";
  }

  function clearWordConstruction() {
    for (let col = 0; col < wordLength; col++) {
      removeLetterBlock(col);
    }
  }

  function animateWordConstructionSuccess() {
    const letters = document.querySelectorAll(".letter-block");
    let delay = 0;

    // Animate each letter
    letters.forEach((letter, index) => {
      setTimeout(() => {
        letter.classList.add("enlarge");
        setTimeout(() => letter.classList.remove("enlarge"), 100); // Duration of letter animation
      }, delay);
      delay += 100; // Increment delay for next letter
    });

    // Flash the background after all letters have been animated
    setTimeout(() => {
      const wordConstruction = document.querySelector("#word-construction");
      wordConstruction.classList.add("success");
      setTimeout(() => wordConstruction.classList.remove("success"), 600); // Duration of flash animation
    }, delay - 300);

    // After all animations, clear the word (if applicable)
    setTimeout(() => {
      clearWordConstruction();
    }, delay + 600);
  }

  function animateWordConstructionFailure() {
    const wordConstruction = document.querySelector("#word-construction");
    wordConstruction.classList.add("failure");
    setTimeout(() => wordConstruction.classList.remove("failure"), 500); // Duration of flash animation

    // After all animations, clear the word (if applicable)
    setTimeout(() => {
      clearWordConstruction();
      clearSelection();
    }, 500);
  }

  // function animateWordConstructionFailure() {
  //   const wordConstruction = document.querySelector("#word-construction");
  //   wordConstruction.classList.add("flash-red");

  //   // Add shake effect to each letter
  //   const letters = document.querySelectorAll(".letter-block");
  //   letters.forEach((letter) => {
  //     letter.classList.add("shake");
  //     setTimeout(() => {
  //       letter.classList.remove("shake");
  //       wordConstruction.classList.remove("flash-red");
  //     }, 500); // Duration of shake animation
  //   });

  //   // Clear the word construction area after the animation
  //   setTimeout(() => {
  //     clearWordConstruction();
  //     clearSelection();
  //   }, 500); // Adjust timing as necessary
  // }

  // modal handling

  // help button
  document.getElementById("helpButton").addEventListener("click", () => {
    // Code to show help modal
    document.getElementById("helpModal").style.display = "block";
    if (!gameOver) pauseGame();
  });

  // close buttons
  const closeButtons = document.querySelectorAll(".close-modal-button");
  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  function closeModal(event) {
    let modal = event.target.closest(".modal");
    if (modal) {
      modal.style.display = "none";
    }
  }
});
