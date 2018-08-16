import * as imageURL from "./space.jpg";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { observer } from "mobx-react";
import { observable } from "mobx";
import "./image.css";

@observer
class App extends React.Component {
  @observable
  $result: string | undefined;

  async componentDidMount() {
    const response = await fetch(process.env.API_SERVER_LOCATION);
    this.$result = await response.text();
  }

  render() {
    return (
      <div>
        <b>Response</b>: {this.$result || "Loading..."}
        <div>
          <img src={imageURL} width={400} />
        </div>
        <div className="image-test" />
      </div>
    );
  }
}

const container = document.createElement("div");
document.body.appendChild(container);
ReactDOM.render(<App />, container);
