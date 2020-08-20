import React, { Component } from 'react';
import { Card, Button, Form } from 'react-bootstrap';
import axios from 'axios';

// { username: "user001", token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZ…c4MH0.F2imC-e7RUGaMjc3eExHxMes29yvK3ilkA-UbrCjvPM", spoolID: "8:spool:83b6e1cf-ced2-490d-bc84-07c1a7387d71_db012a-f806739089", spoolToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEwMiIsInR5cCI6IkpXVC…fVSn3sAeI_s0kZ5uoJH29gtY_qbANvJ-t76IGwBAcbMph0E_g" }

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            password: ""
        }
    }

    // Handle username/password change
    handleChange = (evt) => {
        this.setState({ [evt.target.name]: evt.target.value });
    }

    // onLogin set user details and setPage to dashboard
    onLogin = async () => {
        const userCreds = {
            username: this.state.username,
            password: this.state.password
        }
        console.log(userCreds);
        axios.post('/auth/login', userCreds)
            .then(response => {
                this.props.setUserDetails(response.data);
                this.props.setPage("dashboard");
            });
    }

    render() {
        return (
            <div>
                <Card style={{ width: '24rem', position: 'absolute', top: '25%', left: '38%' }}>
                    <Card.Body>
                        <Card.Title>Login</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">Azure Communication Services</Card.Subtitle>
                        <Card.Body>
                            <Form>
                                <Form.Group>
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control type="text" placeholder="Enter username" name="username" value={this.state.username} onChange={this.handleChange} required />
                                </Form.Group>

                                <Form.Group>
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control type="password" placeholder="Password" name="password" value={this.state.password} onChange={this.handleChange} required />
                                </Form.Group>
                                <Button variant="primary" onClick={this.onLogin}>
                                    Login
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card.Body>
                </Card>
            </div>
        );
    }
}

export default Login;