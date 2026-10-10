import React from 'react';
import { cn } from '../../../engine/cn';

interface BlockProps {
  onClick: () => void;
  isMine: boolean;
  visited: boolean;
  x: number;
  y: number;
  count: number;
}

export default class Block extends React.Component<BlockProps> {

  render() {

    return (
      <div className={cn({ active: !this.props.visited, inactive: this.props.visited })}
           onClick={this.props.onClick}>
        <span className={cn({ visible: this.props.isMine, mine: this.props.isMine })}>
        </span>
        <span className={cn({
          hidden: !this.props.visited || this.props.isMine,
          'prox-1': this.props.count === 1,
          'prox-2': this.props.count === 2,
          'prox-3': this.props.count === 3
        })}>
          {this.props.count === 0 ? '' : this.props.count}
        </span>
      </div>
    );
  }
}
