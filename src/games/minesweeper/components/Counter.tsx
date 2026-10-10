import React from 'react';

interface CounterState {
  count: number;
}

export default class Counter extends React.Component<{}, CounterState> {
  count = 1000;
  counter: number | null = null;
  paused = false;

  constructor(props: {}) {
    super(props);
    this.state = { count: this.count };
  }

  componentDidMount() {
    this.counter = window.setInterval(() => {
      if (this.paused) {
        this.count = this.count - 1;
      }

      if (this.count <= 0) {
        this.stop();
        return;
      }
      this.setState({
        count: this.count
      });

    }, 1000);
  }

  componentWillUnmount() {
    this.clearTimer();
  }

  render() {
    return (<div>{this.state.count}</div>);
  }

  reset() {
    this.count = 1000;
  }

  stop() {
    this.clearTimer();
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  private clearTimer() {
    if (this.counter !== null) {
      window.clearInterval(this.counter);
    }
  }
}
