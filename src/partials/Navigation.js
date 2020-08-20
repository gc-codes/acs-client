import React, { Component } from 'react';
import { Navbar } from 'react-bootstrap';

class Navigation extends Component {
    render() {
        return <Navbar bg="dark" variant="dark">
            <Navbar.Brand href="#home">
                <img
                    alt=""
                    src="https://i1.wp.com/jaredrhodes.com/wp-content/uploads/2019/01/azure-logo.png?fit=1200%2C936&ssl=1"
                    width="30"
                    height="30"
                    className="d-inline-block align-top"
                />{' '}
            Azure Communication Services
        </Navbar.Brand>
            <Navbar.Collapse className="justify-content-end">
                <Navbar.Text>
                    <b>User:</b> {this.props.userDetails.username}
                </Navbar.Text>
            </Navbar.Collapse>
        </Navbar>
    }
}

export default Navigation;