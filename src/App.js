import React from 'react';
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
  for (const dependencyEdge of dependencyEdges) {
    console.log(dependencyEdge);
    edges.add({
      from: dependencyEdge.from.id, to: dependencyEdge.to.id, arrows: 'to',
      color: {
        color: dependencyEdge.conditional ? 'red' : 'black'
      }
    });

  }
}


function App() {
  return (
    <div className="App">
      <h1>Analyze your GraphQL query</h1>
      <span className="powered">
      Powered by graphql-analyzer 
      <iframe className="github-star" src="https://ghbtns.com/github-btn.html?user=andimarek&repo=graphql-analyzer&type=star&count=true" frameBorder="0" scrolling="0" width="170px" height="20px"></iframe>
      </span>
      <div className="follow">
      <a href="https://twitter.com/andimarek" className="twitter-follow-button" data-show-count="false">Follow @andimarek</a>
      </div>
      <a className="github-fork-ribbon right-top" href="https://github.com/andimarek/graphql-analyzer.com" data-ribbon="Fork me on GitHub" title="Fork me on GitHub" target="_blank" rel="noopener noreferrer">Fork me on GitHub</a>
      <Form></Form>
      <Graph></Graph>

      {/* <span>By Andi Marek</span>
      <br />
      <a href="https://twitter.com/andimarek" target="_blank" rel="noopener noreferrer"> Twitter </a>
      <br />
      <a href="https://github.com/andimarek" target="_blank" rel="noopener noreferrer"> Github </a> */}
    <footer> 
      &copy; Andi Marek 
    </footer>
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
    try {
      const document = parse(this.state.query);
      const schema = buildSchema(this.state.schema);

      rootVertex = analyzeQuery(document, schema);
      createDataSet();
      this.setState({error: null});
    } catch (error) {
      this.setState({error: error.message});
    }
    event.preventDefault();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div className="container">
          <div className="schema">
            <h3>Schema</h3>
            <textarea value={this.state.schema} onChange={this.handleSchema} cols={40} rows={15} />
          </div>
          <div className="query">
            <h3>Query</h3>
            <textarea value={this.state.query} onChange={this.handleQuery} cols={40} rows={15} />
          </div>
          <div className="explanation">
            <h3>Explanation</h3>
            <div className="text">
              <p>Analyze the provided GraphQL query without executing it.</p>
              <p>The result is a dependency graph. Every node (or vertex) represents a
                field of an object type. The arrow (or edge) points
              into the direction of the field which must be resolved before.
            </p>
              <p>Fragment, merged fields and fields on Interfaces are resolved to fields on object types.</p>
              <p>A red arrow indicates that the dependency is conditional and the field will only be resolved
              if the type of the dependency node matches (at execution time) . Black arrows indicate matching types.</p>
            </div>
          </div>
        </div>
        <div className="errors">{this.state.error}</div>
        <button className="submit" type="submit">Analyze</button>
      </form>

    );
  }
}

export default App;
