import React from 'react';

export class NoMatch extends React.Component {
  
  constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="nomatch">Path not found.</div>
        );
    }
}