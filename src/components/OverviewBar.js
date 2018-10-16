/**
* Copyright 2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
import PropTypes from 'prop-types';

import msaConnect from '../store/connect'
import CanvasComponent from './CanvasComponent';

const MSAStats = require('stat.seqs');

/**
 * Creates a small overview box of the sequences for a general overview.
 */
class OverviewBarComponent extends CanvasComponent {

  constructor(props) {
    super(props);
    this.calculateStats();
  }

  componentDidUpdate() {
    this.calculateStats();
    super.componentDidUpdate();
  }

  draw() {
    const tileWidth = this.props.tileWidth;
    const yPos = 0;
    const startTile = Math.floor(this.props.position.xPos / tileWidth);
    const tiles = Math.ceil(this.props.width / tileWidth) + 1;
    let xPos = -this.props.position.xPos % tileWidth;
    for (let i = startTile; i < (startTile + tiles); i++) {
			let height = this.props.height * this.columnHeights[i];
			const remainingHeight = this.props.height - height;
      this.ctx.fillStyle(this.props.fillColor);
      this.ctx.fillRect(xPos, yPos + remainingHeight, tileWidth, height);
      xPos += this.props.tileWidth;
    }
  }

  // TODO: do smarter caching here
  calculateStats() {
    const stats = MSAStats(this.props.sequences.map(e => e.sequence));
    this.columnHeights = [];
    switch (this.props.method) {
      case "conservation":
        this.columnHeights = stats.scale(stats.conservation());
        break;
      case "information-content":
        this.columnHeights = stats.scale(stats.ic());
        break;
      default:
        console.error(this.props.method + "is an invalid aggregation method for <OverviewBar />");
    }
  }
}

OverviewBarComponent.defaultProps = {
  ...CanvasComponent.defaultProps,
  height: 50,
  fillColor: "#999999",
  method: "conservation",
}

OverviewBarComponent.PropTypes = {
  ...CanvasComponent.PropTypes,
  /**
   * Method to use for the OverviewBar:
   *  - `information-content`: Information entropy after Shannon of a column (scaled)
   *  - `conservation`: Conservation of a column (scaled)
   */
  method: PropTypes.oneOf(['information-content', 'conservation']),

  /**
   * Height of the OverviewBar (in pixels), e.g. `100`
   */
  height: PropTypes.number,

  /**
   * Fill color of the OverviewBar, e.g. `#999999`
   */
  fillColor: PropTypes.string,
};

const mapStateToProps = state => {
  return {
    sequences: state.sequences.raw,
    position: state.position,
    width: state.props.width,
    tileHeight: state.props.tileHeight,
    tileWidth: state.props.tileWidth,
    msecsPerFps: state.props.msecsPerFps,
  }
}

export default msaConnect(
  mapStateToProps,
  //mapDispatchToProps
)(OverviewBarComponent);
