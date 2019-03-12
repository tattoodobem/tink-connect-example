import React from 'react';
import { Button, Col, Row } from 'reactstrap';
import Header from './Header';
import { formatDate, formatNumber } from '../utils/Format';
import Spinner from './Spinner';

class Main extends React.Component {
  state = {
    code: '',
    token: '',
    data: undefined,
  };
  getData = async (code) => {
  console.log("botauthx getdata");
    const response = await fetch('/botauth', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({code: code}),
    });

    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);
    return body;
  };

  componentDidMount() {
    const code = new URLSearchParams(this.props.location.search).get('code');
    const error = new URLSearchParams(this.props.location.search).get('error');
    const message = new URLSearchParams(this.props.location.search).get('message');

    this.setState({code: code, error: error, errorMessage: message});

    if (code) {
      this.getData(code)
        .then(res => this.setState({data: res}))
        .catch(err => console.log(err));
    }
  }


   getTokenFromApiResponse() {
    const data = this.state.data;
    if (!data || !data.response || !data.response.cookie) {
      return undefined;
    } else {
	const token = data.response.cookie;
      return (
        <div>
          <h4 className="pink">Your authentication token</h4>
          <div style={{margin: '30px'}}>
            {token}
          </div>
        </div>
      );
    }
  }

  getContent() {
 
    const accessToken = this.getTokenFromApiResponse();
    if (accessToken) {
      return (
        <Row>
          <Col lg={{size: 6, offset: 3}}>
            {accessToken}
          </Col>
        </Row>
      );
    } else if (this.state.error) {
      return '';
    } else {
      return <Spinner width='50px' image={'./spinner.png'} />;
    }

  }

  render() {

    let header = '';

    if (!this.state.error) {
      header = <Header text="Your bank was successfully connected! :D" emoji="tada" />;
    } else {
      header = <Header text="Something went wrong" emoji="sad" />;
    }
    const content = this.getContent();

    return (
      <div>
        {header}

        {content}

        <p style={{fontSize: '18px', paddingTop: '40px'}}>{this.state.errorMessage}</p>
        <Button style={{margin: '30px'}} href="/">Take me back</Button>

      </div>

    );
  }
}

export default Main;
