import _ from 'lodash';
import React from 'react';
import { rjsClass } from '../util/rjs-directives';

export default class Block extends React.Component {
	
    constructor(props) {
        super(props);
    }

    componentWillMount() {
    }

    render() {
    	
        return (
            <div className={rjsClass({active: !this.props.visited, inactive: this.props.visited})} 
                 onClick={this.props.onClick }>
                <span className={rjsClass({'visible': this.props.isMine, 
                	                       'mine': this.props.isMine})}>
                </span>
                <span className={rjsClass({'hidden': !this.props.visited || this.props.isMine,
                                           'prox-1': this.props.count == 1, 
                                           'prox-2': this.props.count == 2, 
                                           'prox-3': this.props.count == 3})}>
                    { this.props.count == 0 ? '' : this.props.count}
                </span>
            </div>
        );
    }

    
}