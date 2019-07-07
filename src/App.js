import React from 'react';
import logo from './logo.svg';
import './App.css';
import { analyzeQuery } from 'graphql-analyzer';
import { parse } from 'graphql';
import { buildSchema } from 'graphql';
import { Network, DataSet } from 'vis';

let rootVertex;

var nodes = new DataSet([
]);
var edges = new DataSet([
]);

function createDataSet() {
    if(!rootVertex) {
      return;
    }
    nodes.clear();
    edges.clear();
    counter = 1;
    createNodes(rootVertex);
    createEdges(rootVertex);

}
let counter = 1;
// let vertexById  

function createNodes(vertex) {
  let label;
  if (!vertex.objectType) {
    label = "ROOT VERTEX";
  } else {
    label = vertex.objectType.name + "." + vertex.fields[0].name.value;
  }
  vertex.id = counter++;
  nodes.add({ id: vertex.id, label });
  for (const child of vertex.dependOnMe) {
    createNodes(child);
  }
}
function createEdges(vertex) {
  for(const dependOnMe of vertex.dependOnMe) {
    edges.add({from: dependOnMe.id, to: vertex.id, arrows:'to'});
  }
  for (const child of vertex.dependOnMe) {
    createEdges(child);
  }
}

function App() {
  return (
    <div className="App">
      <Form></Form>
      <Graph></Graph>
    </div>
  );
}

class Graph extends React.Component {

  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }

  render() {
    return <div ref={this.myRef} style={{ width: '600px', height: '400px' }} />;
  }
  componentDidMount() {
    // create a network
    var container = this.myRef.current;
    var data = {
      nodes: nodes,
      edges: edges
    };
    var options = {};
    var network = new Network(container, data, options);
  }

}
class Form extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      schema: `type Query {
        dog: Dog  
        cat: Cat
    }
    type Dog {
        name: String
        id: ID
    }
    type Cat {
        name: String
    }`,
      query: `{dog {id name} cat{name}}`
    };

    this.handleSchema = this.handleSchema.bind(this);
    this.handleQuery = this.handleQuery.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSchema(event) {
    this.setState({ schema: event.target.value });
  }
  handleQuery(event) {
    this.setState({ query: event.target.value });
  }

  handleSubmit(event) {
    const document = parse(this.state.query);
    const schema = buildSchema(this.state.schema);
    rootVertex = analyzeQuery(document, schema);
    createDataSet();
    event.preventDefault();
  }

  render() {
    return (
      <div className="example">
        <form onSubmit={this.handleSubmit}>
          <span>Schema</span>
          <textarea value={this.state.schema} onChange={this.handleSchema} cols={40} rows={15} />
          <span>Query</span>
          <textarea value={this.state.query} onChange={this.handleQuery} cols={40} rows={15} />
          <input type="submit" value="Submit" />
        </form>
      </div>
    );
  }
}

export default App;
