import React from 'react';

export default class Counter extends React.Component {

	constructor(props) {
		super(props);

		this.count = 1000;
		this.counter = null;
		this.paused = false;
		this.counter = null;
        this.state = {count:  this.count};
  }

  componentDidMount() {
  	this.counter = window.setInterval(() => {
  		if(this.paused) {
  			this.count = this.count - 1;
  		}

  		if (this.count <= 0)
  		{
  			window.clearInterval(this.counter);
		     //counter ended, do something here
		     this.stop();
		     return;
		 }
		 this.setState({
  				count: this.count
  			});
		  //Do code for showing the number of seconds here

		}, 1000);
  }

  componentWillUnmount() {
  	window.clearInterval(this.counter);
  }

  render() {
  	return (<div>{this.state.count}</div>);
  }

  reset() {
  	this.count = 1000;
  }

  stop() {
  	window.clearInterval(this.counter);
  }

  pause() {
  	this.paused = true;
  }

  resume() {
  	this.paused = false;
  }

}
