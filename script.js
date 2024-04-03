document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const grid = document.getElementById('grid');

    // grid size and number of tiles
    const gridSize = 10;
    const numberOfTiles = 7;

    // sets grid size in the CSS
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 64px)`;
    grid.style.gridTemplateRows = `repeat(${gridSize}, 64px)`;

    // initialize gridState with no connections
    const gridState = Array.from({ length: gridSize }, () => 
                       Array.from({ length: gridSize }, () => [0, 0, 0, 0]));

    // Rrepresentation of the tile connections (in form top/right/bottom/left)
    const tiles = {
        0: [1, 0, 0, 0], // tile_0: endpoint
        1: [0, 1, 1, 0], // tile_1: curve
        2: [1, 0, 1, 0], // tile_2: straight
        3: [0, 1, 1, 1], // tile_3: T
        4: [1, 1, 1, 1], // tile_4: cross
        5: [1, 1, 1, 1], // tile_5: double
        6: [0, 0, 0, 0], // tile_6: blank
    };

    // populate the sidebar with tiles
    for (let i = 0; i < numberOfTiles; i++) {
        let tile = document.createElement('div');
        tile.id = `tile_${i}`;
        tile.className = 'tile';
        tile.style.backgroundImage = `url('images/tile_${i}.png')`;
        tile.draggable = true;
        tile.addEventListener('dragstart', dragStart);
        sidebar.appendChild(tile);
    }

    // create the grid with dots at each corner
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            let slot = document.createElement('div');
            slot.className = 'tile slot';
            slot.setAttribute('data-x', x);
            slot.setAttribute('data-y', y);
            slot.addEventListener('drop', drop);
            slot.addEventListener('dragover', allowDrop);

            // create the grey dots in the corners of each slot
            ['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach((position) => {
                let dot = document.createElement('div');
                dot.className = `dot ${position}`;
                slot.appendChild(dot);
            });

            // add the slot to the grid with its bindings for rotating and deleting (LC and RC)
            slot.addEventListener('click', rotateTile);
            slot.addEventListener('contextmenu', deleteTile);
            grid.appendChild(slot);
        }
    }

    // when the drag starts
    function dragStart(event) {
        event.dataTransfer.setData('text/plain', event.target.id);
    }

    // when dropping, override default behaviour
    function allowDrop(event) {
        event.preventDefault();
    }

    // when a tile is dropped, get the value of the image
    function drop(event) {
        event.preventDefault();
        const data = event.dataTransfer.getData('text/plain');
        const tileType = parseInt(data.split('_')[1]);

        // get the position of the slot
        const x = parseInt(event.target.getAttribute('data-x'));
        const y = parseInt(event.target.getAttribute('data-y'));

        // check if there's already a tile in place and block if needed
        if (gridState[x][y].some(connection => connection !== 0)) {
            return;
        }

        // update gridState with the tile's connections
        gridState[x][y] = [...tiles[tileType]];

        // make a new tile with the correct prerequisites
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.style.backgroundImage = `url('images/${data}.png')`;
        tile.setAttribute('data-x', x);
        tile.setAttribute('data-y', y);
        tile.setAttribute('data-rotation', 0)
        event.target.appendChild(tile);

        updateGridValidity();
    }

    // rotation function
    function rotateTile(event) {
        event.preventDefault();

        // if there's no tile in the clicked slot, do nothing
        let targetTile = event.target.closest('.tile');
        if (!targetTile) return;

        // get the position and rotation of the slot
        const x = parseInt(targetTile.getAttribute('data-x'));
        const y = parseInt(targetTile.getAttribute('data-y'));
        let rotation = parseInt(targetTile.getAttribute('data-rotation')) || 0;

        // rotate by 90º
        rotation = (rotation + 90) % 360;
        targetTile.style.transform = `rotate(${rotation}deg)`;
        targetTile.setAttribute('data-rotation', rotation);

        // rotate connections in gridState by shifting list along
        gridState[x][y] = gridState[x][y].map((_, idx, arr) => arr[(idx + 3) % arr.length]);

        updateGridValidity();
    }

    // deletion function
    function deleteTile(event) {
        event.preventDefault();

        // if there's no tile in the clicked slot, do nothing
        let targetTile = event.target.closest('.tile');
        if (!targetTile) return;

        // get the position of the slot
        const x = parseInt(targetTile.getAttribute('data-x'));
        const y = parseInt(targetTile.getAttribute('data-y'));

        // remove the tile and reset the gridState 
        targetTile.remove()
        gridState[x][y] = [0, 0, 0, 0];

        updateGridValidity();
    }

    // check if the gridState is valid
    function isGridValid() {

        // for each slot in the grid
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {

                // for each direction
                for (let i = 0; i < 4; i++) {

                    // if it's not a spoke, do nothing
                    if (gridState[x][y][i] === 0) continue;
                    
                    // if it's on the edge
                    if ((i === 0 && x === 0) ||
                        (i === 1 && y === gridSize - 1) ||
                        (i === 2 && x === gridSize - 1) ||
                        (i === 3 && y === 0)) {
                        return false;
                    }
                    
                    // otherwise check adjacent cell's shared wall
                    let adjacentCell;
                    if (i === 0) adjacentCell = gridState[x-1][y][2];      // top's bottom
                    else if (i === 1) adjacentCell = gridState[x][y+1][3]; // right's left
                    else if (i === 2) adjacentCell = gridState[x+1][y][0]; // bottom's top
                    else if (i === 3) adjacentCell = gridState[x][y-1][1]; // left's right
                    
                    // if missing the neighbour spoke, then grid is invalid
                    if (adjacentCell === 0) {
                        return false;
                    }
                    
                }
            }
        }
        // otherwise if no errors found, grid is valid
        return true;
    }    

    // displays whether grid is valid on the left
    function updateGridValidity() {

        // gets the indicator
        const isValid = isGridValid();
        let messageElement = document.getElementById('validity-message');

        // if it doesn't exist, then create it (runs at start of program)
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'validity-message';
            sidebar.insertAdjacentElement('beforeend', messageElement);
        }
    
        // updates colour and text based on validity
        if (!isValid) {
            messageElement.style.color = 'red';
            messageElement.textContent = 'GRID INVALID';
        } else {
            messageElement.style.color = 'green';
            messageElement.textContent = "GRID VALID";
        }
    }
    
    // runs indicator setter to show at start
    updateGridValidity();
});
