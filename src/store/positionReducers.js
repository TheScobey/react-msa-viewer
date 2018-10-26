/**
* Copyright 2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

/**
 * A special Redux store that DOES NOT trigger automatically React Tree calculations.
 * This is only used to dispatch very frequent events like `POSITION_{MOVE,UPDATE}`.
 */

import { createStore } from 'redux';

import { createAction } from './actions';

import {
  floor,
  clamp,
} from 'lodash-es';

// send when the main store changes
export const updateMainStore = createAction("MAINSTORE_UPDATE");
// move the position relatively by {xMovement, yMovement}
export const movePosition = createAction("POSITION_MOVE");
// set an absolute position with {yPos, xPos}
export const updatePosition = createAction("POSITION_UPDATE");

export const actions = {
  updateMainStore,
  updatePosition,
  movePosition,
}

/**
 * Makes sure that the position isn't set isn't out of its boundaries.
 */
function commonPositionReducer(prevState, pos) {
  const maximum = prevState.sequences.maxLength;
  const maxWidth = maximum * prevState.props.tileWidth - prevState.props.width;
  pos.xPos = clamp(pos.xPos, 0, maxWidth);
  const maxHeight = prevState.sequences.raw.length * prevState.props.tileHeight - prevState.props.height;
  pos.yPos = clamp(pos.yPos, 0, maxHeight);
  return {
    ...prevState,
    position: pos,
  };
}

/**
 * Reducer for the {move,update}Position events
 */
const relativePositionReducer = (prevState = {position: {xPos: 0, yPos: 0}}, action) => {
  switch (action.type) {
    case movePosition.key:
      const pos = prevState.position;
      pos.xPos += action.payload.xMovement;
      pos.yPos += action.payload.yMovement;
      return commonPositionReducer(prevState, pos);
    case updatePosition.key:
      return commonPositionReducer(prevState, action.payload);
    default:
      return prevState;
  }
}

/**
 * The main position store reducer which adds "position" to
 * the reduced main store.
 */
export function positionReducer(oldState = {position: {xPos: 0, yPos: 0}}, action){
  let state = oldState;
  let position = oldState.position;
  switch(action.type) {
    case updateMainStore.key:
      // merge updates of the main store with this store for now
      state = {
        ...state,
        ...action.payload,
      }
      break;
    case updatePosition.key:
    case movePosition.key:
      position = relativePositionReducer(state, action).position;
      break;
    default:
      return state;
  }
  const addedState = {
    xPosOffset: -(position.xPos % state.props.tileWidth),
    yPosOffset: -(position.yPos % state.props.tileWidth),
    currentViewSequence: clamp(
      floor(state.position.yPos / state.props.tileHeight),
      0,
      state.sequences.length - 1
    ),
    currentViewSequencePosition: clamp(
      floor(position.xPos / state.props.tileWidth),
      0,
      state.sequences.maxLength,
    ),
    position,
  };
  return {
    ...state,
    ...addedState,
  };
}

// for future flexibility
export {
  createStore as createPositionStore,
};
