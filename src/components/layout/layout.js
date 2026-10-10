import React from 'react';
import Header from './header.component'
import Footer from './footer.component'

export default class Layout extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="main" class="container main-container">
              <Header/>
              <div>
                <div id="content">
                   <h1>Content</h1>
                </div>
                <Footer/>
              </div>
            </div>
        );
    }
}
