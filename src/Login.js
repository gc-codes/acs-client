import React, { Component } from 'react';
import { Card, Button, Form } from 'react-bootstrap';

class Login extends Component {
    // onLogin provision new user and setPage to dashboard
    onLogin = async () => {
        fetch('/provisionUser')
            .then(res => res.json())
            .then(newUser => {
                this.props.setUserDetails(newUser);
                this.props.setPage("dashboard");
            });
    }

    render() {
        return (
            <div>
                <Card style={{ width: '24rem', margin: '0 auto', marginTop: '220px' }}>
                    <Card.Body>
                        <Card.Title>Login</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">Azure Communication Services</Card.Subtitle>
                        <Card.Body>
                            <Form>
                                <Form.Group>
                                    <Form.Label>Email address</Form.Label>
                                    <Form.Control type="email" placeholder="Enter email" />
                                    <Form.Text className="text-muted">
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group>
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control type="password" placeholder="Password" />
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