import React, { useEffect } from "react";
import Cell from "./cell";

export default class Board extends React.Component {
  state = {
    boardData: this.initBoardData(
      this.props.height,
      this.props.width,
      this.props.mines
    ),
    gameStatus: "Game in progress",
    mineCount: this.props.mines,
    isClicked: false,
    modal: true,
  };

  /* Helper Functions */

  // get mines
  getMines(data) {
    let mineArray = [];

    data.map((datarow) => {
      datarow.map((dataitem) => {
        if (dataitem.isMine) {
          mineArray.push(dataitem);
        }
      });
    });

    return mineArray;
  }

  // get Flags
  getFlags(data) {
    let mineArray = [];

    data.map((datarow) => {
      datarow.map((dataitem) => {
        if (dataitem.isFlagged) {
          mineArray.push(dataitem);
        }
      });
    });

    return mineArray;
  }

  // get Hidden cells
  getHidden(data) {
    let mineArray = [];

    data.map((datarow) => {
      datarow.map((dataitem) => {
        if (!dataitem.isRevealed) {
          mineArray.push(dataitem);
        }
      });
    });

    return mineArray;
  }

  // get random number given a dimension
  getRandomNumber(dimension) {
    // return Math.floor(Math.random() * dimension);
    return Math.floor(Math.random() * 1000 + 1) % dimension;
  }

  // Gets initial board data
  initBoardData(height, width, mines) {
    let data = this.createEmptyArray(height, width);
    data = this.plantMines(data, height, width, mines);
    data = this.getNeighbours(data, height, width);
    return data;
  }

  createEmptyArray(height, width) {
    let data = [];

    for (let i = 0; i < height; i++) {
      data.push([]);
      for (let j = 0; j < width; j++) {
        data[i][j] = {
          x: i,
          y: j,
          isMine: false,
          neighbour: 0,
          isRevealed: false,
          isEmpty: false,
          isFlagged: false,
        };
      }
    }
    return data;
  }

  // plant mines on the board
  plantMines(data, height, width, mines) {
    let randomx,
      randomy,
      minesPlanted = 0;

    while (minesPlanted < mines) {
      randomx = this.getRandomNumber(width);
      randomy = this.getRandomNumber(height);
      if (!data[randomx][randomy].isMine) {
        data[randomx][randomy].isMine = true;
        minesPlanted++;
      }
    }

    return data;
  }

  // get number of neighbouring mines for each board cell
  getNeighbours(data, height, width) {
    let updatedData = data,
      index = 0;

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (data[i][j].isMine !== true) {
          let mine = 0;
          const area = this.traverseBoard(data[i][j].x, data[i][j].y, data);
          area.map((value) => {
            if (value.isMine) {
              mine++;
            }
          });
          if (mine === 0) {
            updatedData[i][j].isEmpty = true;
          }
          updatedData[i][j].neighbour = mine;
        }
      }
    }

    return updatedData;
  }

  // looks for neighbouring cells and returns them
  traverseBoard(x, y, data) {
    const el = [];

    //up
    if (x > 0) {
      el.push(data[x - 1][y]);
    }

    //down
    if (x < this.props.height - 1) {
      el.push(data[x + 1][y]);
    }

    //left
    if (y > 0) {
      el.push(data[x][y - 1]);
    }

    //right
    if (y < this.props.width - 1) {
      el.push(data[x][y + 1]);
    }

    // top left
    if (x > 0 && y > 0) {
      el.push(data[x - 1][y - 1]);
    }

    // top right
    if (x > 0 && y < this.props.width - 1) {
      el.push(data[x - 1][y + 1]);
    }

    // bottom right
    if (x < this.props.height - 1 && y < this.props.width - 1) {
      el.push(data[x + 1][y + 1]);
    }

    // bottom left
    if (x < this.props.height - 1 && y > 0) {
      el.push(data[x + 1][y - 1]);
    }

    return el;
  }

  // reveals the whole board
  revealBoard() {
    let updatedData = this.state.boardData;
    updatedData.map((datarow) => {
      datarow.map((dataitem) => {
        dataitem.isRevealed = true;
      });
    });
    this.setState({
      boardData: updatedData,
    });
  }

  /* reveal logic for empty cell */
  revealEmpty(x, y, data) {
    let area = this.traverseBoard(x, y, data);
    area.map((value) => {
      if (
        !value.isFlagged &&
        !value.isRevealed &&
        (value.isEmpty || !value.isMine)
      ) {
        data[value.x][value.y].isRevealed = true;
        if (value.isEmpty) {
          this.revealEmpty(value.x, value.y, data);
        }
      }
    });
    return data;
  }

  // Handle User Events

  handleCellClick(x, y) {
    const gridCell = this.state.boardData[x][y];

    gridCell.isClicked = true;

    // check if revealed. return if true.
    if (
      this.state.boardData[x][y].isRevealed ||
      this.state.boardData[x][y].isFlagged
    )
      return null;

    // check if mine. game over if true
    if (this.state.boardData[x][y].isMine) {
      this.revealBoard();
      setTimeout(() => {
        this.setState({ gameStatus: "You Lost" });
      }, [1000])
    }

    let updatedData = this.state.boardData;
    updatedData[x][y].isFlagged = false;
    updatedData[x][y].isRevealed = true;

    if (updatedData[x][y].isEmpty) {
      updatedData = this.revealEmpty(x, y, updatedData);
    }

    if (this.getHidden(updatedData).length === this.props.mines) {
      this.revealBoard();
      setTimeout(() => {
        this.setState({ mineCount: 0, gameStatus: "You Win" });
      }, [1000])
    }

    this.setState({
      boardData: updatedData,
      mineCount: this.props.mines - this.getFlags(updatedData).length,
    });
  }

  handleContextMenu(e, x, y) {
    e.preventDefault();
    let updatedData = this.state.boardData;
    let mines = this.state.mineCount;

    // check if already revealed
    if (updatedData[x][y].isRevealed) return;

    if (updatedData[x][y].isFlagged) {
      updatedData[x][y].isFlagged = false;
      mines++;
    } else {
      updatedData[x][y].isFlagged = true;
      mines--;
    }

    if (mines === 0) {
      const mineArray = this.getMines(updatedData);
      const FlagArray = this.getFlags(updatedData);
      if (JSON.stringify(mineArray) === JSON.stringify(FlagArray)) {
        this.setState({ mineCount: 0, gameStatus: "You Win." });
        this.revealBoard();
      }
    }

    this.setState({
      boardData: updatedData,
      mineCount: mines,
    });
  }

  renderBoard(data) {
    return data.map((datarow) => {
      return datarow.map((dataitem, index) => {
        return (
          <div chave={dataitem.x * datarow.length + dataitem.y} key={index}>
            <Cell
              onClick={() => this.handleCellClick(dataitem.x, dataitem.y)}
              cMenu={(e) => this.handleContextMenu(e, dataitem.x, dataitem.y)}
              value={dataitem}
            />
          </div>
        );
      });
    });
  }

  handleStart() {
    this.setState({ modal: false });
  }

  handleRestart() {
    window.location.reload();
  }

  render() {
    return (
      <div className="play">
        {this.state.modal === true ? (
          <div className="modal">
            <div className="modal-content modal-start">Minefields</div>
            <button onClick={() => this.handleStart()} className="btn start">
              Start
            </button>
          </div>
        ) : (
          <></>
        )}

        <div
          className={`game ${this.state.gameStatus
            .toLowerCase()
            .replace(/\s+/g, "-")}`}
        >
          <div className="board">{this.renderBoard(this.state.boardData)}</div>
        </div>

        {/* RESULTADO */}

        {this.state.gameStatus === "You Lost" ? (
          <div className="modal">
            <div className="modal-content modal-lost">GAME OVER</div>
            <button onClick={() => this.handleRestart()} className="btn restart">
              Restart
            </button>
          </div>
        ) : (
          <></>
        )}

        {this.state.gameStatus === "You Win" ? (
          <div className="modal">
            <div className="modal-content modal-win">YOU WIN</div>
            <button onClick={() => this.handleRestart()} className="btn menu">
              MENU
            </button>
          </div>
        ) : (
          <></>
        )}
      </div>
    );
  }
}