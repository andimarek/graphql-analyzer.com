import React from 'react';
import logo from './logo.svg';
import './App.css';
import { analyzeQuery } from 'graphql-analyzer';
import { parse } from 'graphql';
import { buildSchema } from 'graphql';
import { Network, DataSet } from 'vis';
import { printDependencyGraph } from 'graphql-analyzer';

let rootVertex;

var nodes = new DataSet([
]);
var edges = new DataSet([
]);

let network;

function createDataSet() {
  if (!rootVertex) {
    return;
  }
  nodes.clear();
  edges.clear();
  const [vertices, dependencyEdges] = printDependencyGraph(rootVertex);
  createNodes(vertices);
  createEdges(dependencyEdges);
  network.fit();

}
function createNodes(vertices) {
  let label;
  for (const vertex of vertices) {
    if (!vertex.fieldDefinition) {
      label = "ROOT";
    } else {
      label = vertex.objectType.name + "." + vertex.fields[0].name.value + ": " + vertex.fieldDefinition.type;
    }
    nodes.add({ id: vertex.id, label });
  }
}
function createEdges(dependencyEdges) {
  // for (const dependOnMe of vertex.dependOnMe) {
  //   edges.add({ from: dependOnMe.id, to: vertex.id, arrows: 'to' });
  // }
  // for (const child of vertex.dependOnMe) {
  //   createEdges(child);
  // }
  for (const dependencyEdge of dependencyEdges) {
    console.log(dependencyEdge);
    edges.add({
      from: dependencyEdge.from.id, to: dependencyEdge.to.id, arrows: 'to',
      color: {
        color: dependencyEdge.conditional ? 'red' : 'blue'
      }
    });

  }
}


function App() {
  return (
    <div className="App">
      <h1>Analyze your GraphQL query</h1>
      <Form></Form>
      <Graph></Graph>

      <span>By Andi Marek</span>
      <br />
      <a href="https://twitter.com/andimarek" target="_blank" rel="noopener noreferrer"> Twitter </a>
      <br />
      <a href="https://github.com/andimarek" target="_blank" rel="noopener noreferrer"> Github </a>
    </div>
  );
}

class Graph extends React.Component {

  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }

  render() {
    return <div ref={this.myRef} id="graph" />;
  }
  componentDidMount() {
    // create a network
    var container = this.myRef.current;
    var data = {
      nodes: nodes,
      edges: edges
    };
    var options = {
      layout: {
        hierarchical: {
          enabled: true,
          sortMethod: "directed",
          direction: "DU"
        }
      }
    };
    network = new Network(container, data, options);
  }

}
class Form extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      schema: `type Query {
    pets: [Pet]
}
interface Pet {
  name: String
}
type Dog implements Pet{
    name: String
    dogFriends: [Dog]
}
type Cat implements Pet{
    name: String
}`,
      query: `{ pets {
  name
  ... on Dog {
    dogFriends {
      name
    }
  }
}}`
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
          <div className="schema">
            <h3>Schema</h3>
            <textarea value={this.state.schema} onChange={this.handleSchema} cols={40} rows={15} />
          </div>
          <div className="query">
            <h3>Query</h3>
            <textarea value={this.state.query} onChange={this.handleQuery} cols={40} rows={15} />
          </div>
          <button className="submit" type="submit">Analyze</button>
        </form>
      </div>
    );
  }
}

export default App;
