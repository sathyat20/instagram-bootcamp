import React, { useState, useEffect } from "react";
import { onChildAdded, push, ref, set } from "firebase/database";
import { database, storage, auth } from "./firebase";
import "./App.css";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import "bootstrap/dist/css/bootstrap.css";
import "font-awesome/css/font-awesome.min.css";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "firebase/auth";

// Save the Firebase message folder name as a constant to avoid bugs due to misspelling
const DB_MESSAGES_KEY = "messages";
const STORAGE_KEY = "images/";

class App extends React.Component {
  constructor(props) {
    super(props);
    // Initialise empty messages array in state to keep local state in sync with Firebase
    // When Firebase changes, update local state, which will update local UI
    this.state = {
      messages: [],
      value: "",
      fileInputFile: null,
      fileInputValue: "",
      email: "", 
      password: "",
      isLoggedIn: false,
      user: {}
    };
  }

  // const [messages, setMessages] = useState([])
  // const [value, setValue] = useState("")
  // const [fileInputFile, setFileInputFile] = useState(null)
  // const [fileInputValue, setFileInputValue] = useState("")
  // const [email, setEmail] = useState("")
  // const [password, setPassword] = useState("")
  // const [isLoggedIn, setIsLoggedIn] = useState(false)
  // const [user, setUser] = useState({})

  componentDidMount() {
    const messagesRef = ref(database, DB_MESSAGES_KEY);
    // onChildAdded will return data for every child at the reference and every subsequent new child
    onChildAdded(messagesRef, (data) => {
      // Add the subsequent child to local component state, initialising a new array to trigger re-render
      this.setState((state) => ({
        // Store message key so we can use it as a key in our list items when rendering messages
        messages: [...state.messages, { key: data.key, val: data.val() }],
      }));
    });

  // useEffect(() => {
  //   const messagesRef = ref(database, DB_MESSAGES_KEY);
  //   onChildAdded(messagesRef, (data) => {
  //     // Add the subsequent child to local component state, initialising a new array to trigger re-render
  //     setMessages([...messages, { key: data.key, val: data.val() }])
  //     // this.setState((state) => ({
  //     //   // Store message key so we can use it as a key in our list items when rendering messages
  //     //   messages: [...state.messages, { key: data.key, val: data.val() }],
  //     // }));
  // })})

    onAuthStateChanged(auth, (userInfo) => {
      if (userInfo) {
        //signed in user
        this.setState({
          user: userInfo,
          isLoggedIn: true
        })

      } else {
        //no signed in user 
        this.setState({
          user: {},
          isLoggedIn: false,
        });
      }
    })
  }

  logout = () => {
    signOut(auth).then(() => {
      console.log("Signed Out")
    })
  }

  // Note use of array fields syntax to avoid having to manually bind this method to the class
  writeData = (url) => {
    const messageListRef = ref(database, DB_MESSAGES_KEY);
    const newMessageRef = push(messageListRef);

    set(newMessageRef, {
      date: new Date().toLocaleTimeString(),
      url: url, 
      value: this.state.value,
      email: this.state.email
    });

    this.setState({
      value: "",
      fileInputFile: null,
      fileInputValue: ""
    })
  };

  handleChange = (event) => {
  //  let name = event.target.name;
  //  let value = event.target.value;
    const name = event.target.id
    const value = event.target.value

   this.setState({
      value : event.target.value,
      [name] : value  
   });
  };

  handleSubmit = (event) => {
    event.preventDefault();
  };

  submit = () => {
    const fullStorageRef = storageRef(
      storage,
      STORAGE_KEY + this.state.fileInputFile.name
    );
    uploadBytes(fullStorageRef, this.state.fileInputFile).then((snapshot) => {
      getDownloadURL(fullStorageRef, this.state.fileInputFile.name).then(
        (url) => {
          this.writeData(url);
        }
      );
    });
  };

  render() {
    //Convert messages in state to message JSX elements to render

    let messageListItems = this.state.messages.map((message) => (
      <div className="col-md-4 mb-4" key={message.key}>
        {/* <li key={message.key}> */}
        <div className="card card-custom">
          {/* {JSON.stringify(message.val).replace(/^"|"$/g, "")} */}
          {message.val.url ? (
            <img
              src={message.val.url}
              className="card-img-top"
              alt={message.val.name}
            />
          ) : (
            <p>No Images </p>
          )}
          <div className="card-body">
            <p className="card-text">{message.val.value}</p>
            <p>{message.val.email ? message.val.email : null}</p>
          </div>
          {/* </li> */}
        </div>
      </div>
    )); 

    return (
      <div className="App">
        <header className="App-header">
          {/* TODO: Add input field and add text input as messages in Firebase */}
          {this.state.isLoggedIn ? (
            <button onClick={this.logout}>Sign Out</button>
          ) : (
            <div>
              <div>
                <label>
                  Email:
                  <input
                    type="text"
                    id="email"
                    placeholder="Enter Email"
                    value={this.state.email}
                    onChange={(e) => this.handleChange(e)}
                  />
                </label>
                <br />
                <label>
                  Password:
                  <input
                    type="password"
                    id="password"
                    placeholder="Enter Password"
                    value={this.state.password}
                    onChange={(e) => this.handleChange(e)}
                  />
                </label> 
              </div>
              <button
                onClick={async () => {
                  return createUserWithEmailAndPassword(
                    auth,
                    this.state.email,
                    this.state.password
                  ).then((userInfo) => {
                    console.log(userInfo);
                    console.log("Successful sign up");
                    this.setState({
                      email: "",
                      password: "" 
                    })
                  });
                }}
              >
                Sign Up  
              </button>
              <button
                onClick={async () => {
                  return signInWithEmailAndPassword(
                    auth,
                    this.state.email,
                    this.state.password
                  ).then((userInfo) => {
                    console.log(userInfo);
                    console.log("Successful sign in")
                  //   this.setState({
                  //     user: userInfo.user,
                  //     isLoggedIn: true 
                  // });
                })}}>
                Login
              </button>
              {this.state.email.length > 10 ? 
              <button onClick={()=>sendPasswordResetEmail(auth, this.state.email).then(() => console.log("email sent"))}>Forgotten Password</button>
               : null}
            </div> 
          )} 

          {this.state.isLoggedIn ? ( 
            <div>
              <form onSubmit={this.handleSubmit}>
                <label>
                  Message:
                  <input
                    type="text"
                    name="value"
                    placeholder="Insert Message"
                    value={this.state.value}
                    onChange={(e) => this.handleChange(e)}
                  />
                </label>
                <input
                  type="file"
                  name="file"
                  // Set state's fileInputValue to "" after submit to reset file input
                  value={this.state.fileInputValue}
                  onChange={(e) =>
                    // e.target.files is a FileList object that is an array of File objects
                    // e.target.files[0] is a File object that Firebase Storage can upload
                    this.setState({
                      fileInputFile: e.target.files[0],
                      fileInputValue: e.target.file,
                    })
                  }
                />
                <button onClick={this.submit}>Send</button>
              </form>{" "}
              <div className="container">
                <div className="row">{messageListItems}</div>
              </div>
            </div>
          ) : null}
        </header>
      </div>
    );
  }
}

export default App;
