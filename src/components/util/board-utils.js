export function generateNewBoardBlocks() {

      let dimension = 9;
      let board = [dimension];
      let counter = 1, i = 0, j = 0;

      for (let i = 0; i < dimension; i++) {
        board[i] = [dimension];
        for (let j = 0; j < dimension; j++) {
          board[i][j] = {
                 key: counter,
                 x: i,
                 y: j,
                 visited: false,
                 isMine: false,
                 count: 0
          };
          counter++;
        }
        //reset
        j = 0;
      }
      generateRandomMineNodes(dimension, board);

     return board;
}



export function adjacentNodes(node, nodesArray) {

    let x = node.x, y = node.y;
    let nodes = [];

    // left
    if(x > 0) {
       nodes.push(nodesArray[x-1][y]);
    }
    // right
    if(x + 1 < nodesArray.length) {
       nodes.push(nodesArray[x+1][y]);
    }

    // upper left
    if(x > 0 && y > 0) {
       nodes.push(nodesArray[x-1][y-1]);
    }
    // upper center
    if(y > 0) {
       nodes.push(nodesArray[x][y-1]);
    }
    // upper right
    if(y > 0 && x + 1 < nodesArray.length) {
       nodes.push(nodesArray[x+1][y-1]);
    }

     // lower left
    if(x > 0 && y + 1 < nodesArray[0].length) {
       nodes.push(nodesArray[x-1][y+1]);
    }
    // lower center
    if(y + 1 < nodesArray[0].length) {
       nodes.push(nodesArray[x][y+1]);
    }
    // lower right
    if(x + 1 < nodesArray.length && y + 1 < nodesArray[0].length) {
       nodes.push(nodesArray[x+1][y+1]);
    }

    return nodes;

}

export function processBlockAction(block, gameBlocks) {

    // set as visited
    gameBlocks[block.x][block.y].visited = true;

    if(block.count == 0) {

      let nodes = adjacentNodes(block, gameBlocks).filter(node => !node.visited);

      if(nodes.length == 0) {
         return;
      }

      for(let i = 0; i < nodes.length; i++) {
        let n = nodes[i];
        if(!n.isMine) {
          if(n.count == 0) {
             processBlockAction(n, gameBlocks);
          } else {
             gameBlocks[n.x][n.y].visited = true;
          }
        }
      }
    }
    return gameBlocks;
}

export function processMineBlockAction(block, gameBlocks) {

    // reveal all mines and the game is over
    gameBlocks.forEach(x => {
      x.forEach(block => {

        if(block.isMine) {
            gameBlocks[block.x][block.y].visited = true;
        }
     });
    });

    return gameBlocks;
}


export function generateRandomMineNodes(dimension, gameBlocks) {

    let randomNodes = [];
    let blockCount = dimension * dimension;
    //let mineCount = blockCount * .1; (auto calc by percent)
    let mineCount = 10;

    for(let i = 0; i < mineCount; i++) {
       randomNodes.push(Math.floor((Math.random() * blockCount -1)) + 1);

    }

    gameBlocks.forEach(x => {
      x.forEach(block => {

        if(randomNodes.indexOf(block.key) >= 0) {

          block.isMine = true;

          adjacentNodes(block, gameBlocks).forEach(node => {
             node.count = node.count + 1;
          });

        }
     });
    });
}


export function processGameState(gameBlocks) {

    // check game state
    let isSuccess = true;

    gameBlocks.forEach(x => {
      x.forEach(block => {

        if(!block.isMine && !block.visited) {
           isSuccess = false;
        }
     });
    });

    return isSuccess;
}
