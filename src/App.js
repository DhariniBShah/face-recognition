import React, { Component } from 'react';
import './App.css';

import Particles from 'react-particles-js';

import Navigation from './components/navigation/Navigation';
import SignIn from './components/signIn/SignIn';
import Register from './components/register/Register';
import ImageLinkForm from './components/imageLinkForm/ImageLinkForm';
import Rank from './components/rank/Rank';
import FaceRecognition from './components/faceRecognition/FaceRecognition'

import Clarifai from 'clarifai';

const app = new Clarifai.App({
  apiKey: '7f580a07a6434a7cb822ee913db81d99'
});

const particlesJSON =
  {
    "particles": {
      "number": {
        "value": 50,
        "density": {
          "enable": true,
          "value_area": 1000
        }
      },
      "color": {
       "value" : [ "#03C8A8","#89D8D3","#74F2CE", "#e0fcf4"]
      },
      "shape": {
        "type": "edge",
        "stroke": {
          "width": 0,
          "color": "#fff"
        },
        "polygon": {
          "nb_sides": 5
        },
      },
      "opacity": {
        "value": 0.5,
        "random": true,
        "anim": {
          "enable": true, 
          "speed": 1,
          "opacity_min": 0.1,
          "sync": false
        }
      },
      "size": {
        "value": 70,
        "random": true,
        "anim": {
          "enable": false,
          "speed": 1,
          "size_min": 10,
          "sync": false
        }
      },
      "line_linked": {
        "enable": false,
        "distance": 100,
        "color": "#ffffff",
        "opacity": 0.5,
        "width": 1
      },
      "move": {
        "enable": true,
        "speed": 2,
        "direction": "top", //none, top, top-right, right, bottom-right, bottom, bottom-left, left, top-left
        "random": false,
        "straight": false,
        "out_mode": "out", // out
        "attract": {
          "enable": true,
          "rotateX": 1000,
          "rotateY": 1000
        }
      }
    }
  }

class App extends Component {
  constructor() {
    super();
    this.state = {
      input: '',
      imageUrl: '',
      box: {},
      route: 'signin',
      isSignedIn: false,
      user: {
        id: '',
        name: '',
        email: '',
        entries: 0,
        joined: ''
      }
    }
  }

  loadUser = (data) => {
    this.setState({
      user : {
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined
    }
    })
  }

  calculateFaceLocation = (data) => {
    const clarifai_face = data.outputs[0].data.regions[0].region_info.bounding_box
    const image = document.getElementById('inputImage');
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifai_face.left_col *  width,
      topRow: clarifai_face.top_row *  height,
      rightCol: width - (clarifai_face.right_col *  width),
      bottomRow: height - (clarifai_face.bottom_row *  height)
    }
  }

  displayFaceBox = (box) => {
    console.log(box);
    this.setState({ box: box })
  }

  onInputChange = (event) => {
    this.setState({ input: event.target.value })
  }

  onButtonSubmit = () => {
    this.setState({ imageUrl: this.state.input })
    app.models.predict(
      Clarifai.FACE_DETECT_MODEL, this.state.input)
      .then(
        (response) => { 
          if(response) {
            fetch('http://localhost:3000/image', {
              method: 'put',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  id: this.state.user.id
              })
            })
            .then(response => response.json())
            .then(count => {
              this.setState( 
                Object.assign(this.state.user, { entries: count })
              )
            }) 
          }
          this.displayFaceBox(this.calculateFaceLocation(response))
        }).catch(
          err => console.log(err)
      );
  }

  onRouteChange = (route) => {
    if(route === 'signout') {
      this.setState({ isSignedIn: false })
    } else if (route === 'home') {
      this.setState({ isSignedIn: true })
    }
    this.setState({ route: route });    
  }

  render() {
  
    const { imageUrl, route, isSignedIn } = this.state;
    return (
      <div className="App">
      <Particles
        className = 'particles' 
        params={particlesJSON} 
      />
       <Navigation isSignedIn = { isSignedIn } onRouteChange = { this.onRouteChange } />
       { 
          route === 'home' ?
          <div>
            <Rank name = { this.state.user.name } entries = { this.state.user.entries } /> 
            <ImageLinkForm 
              onInputChange = { this.onInputChange } 
              onButtonSubmit = { this.onButtonSubmit }   
            />  
            <FaceRecognition box = {this.state.box} imageUrl = {imageUrl} />
          </div>
            : (
              route === 'signin' ?
              <SignIn loadUser = { this.loadUser } onRouteChange = { this.onRouteChange }/> 
              :
              <Register loadUser = { this.loadUser } onRouteChange = { this.onRouteChange }/> 
            ) 
       }
      </div>
    );
  }  
}

export default App;
