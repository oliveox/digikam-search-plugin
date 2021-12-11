import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Button, Col, Container, Row } from 'react-bootstrap';
import CheckboxTree from './CheckBoxTree/CheckBoxTree';
import ControlPanel from './Components/ControlPanel';
import SearchMenu from './Components/SearchMenu';
import Gallery from './Gallery/Gallery';

type SearchTypes = {
  metadata: Array<any>,
  categories: Array<any>,
  visualObjects: Array<any>
}

type AppState = {
  // searchOptions: SearchTypes,
  mediaUnits: Array<any>,
  // textFieldSearch: string,
  // checkedMetadata: Array<any>,
  // checkedCategories: Array<any>,
  // checkedVisualObjects: Array<any>,
  error: string,
  // uploadFiles: Array<any>
};

class App extends React.Component<{}, AppState> {

  constructor (props: any) {
    super(props)
    this.state = {
      // searchOptions: { metadata: [], categories: [], visualObjects: [] },
      mediaUnits: [],
      // textFieldSearch: "",
      // checkedMetadata: [],
      // checkedCategories: [],
      // checkedVisualObjects: [],
      error: "",
      // uploadFiles: []
    }
  }
  

  componentDidMount() {
    fetch(`http://${process.env.REACT_APP_IP}:3001/gallery`)
    .then(res => res.json())
    .then(res => {
      this.setState({
        mediaUnits: res
      })
    })
    .catch(err => this.setState({error: err}))

    // fetch("http://localhost:3001/menu")
    // .then(res => res.json())
    // .then(res => {
    //   this.setState({
    //     searchOptions: res
    //   })
    // })
    // .catch(err => this.setState({error: err}))
  }

  // onTextFieldSearchHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const searchTerm = event.target.value;
  //   this.setState({textFieldSearch: searchTerm}, this.getGallery);
  // }

  // onFilesUploadBrowseHandler = (event: any) => {
  //   this.setState({
  //     uploadFiles: event.target.files
  //   })
  // }

  getGallery = (searchOptions: any) => {

    // let body = {
    //   textField: this.state.textFieldSearch,
    //   metadata: this.state.checkedMetadata,
    //   categories: this.state.checkedCategories,
    //   visualObjects: this.state.checkedVisualObjects
    // };

    const requestOptions = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(searchOptions)
    }

    fetch(`http://${process.env.REACT_APP_IP}:3001/gallery`, requestOptions)
    .then(res => res.json())
    .then(res => this.setState({mediaUnits: res}))
  }

  render() {

    let error;

    // SEARCH MENU

    // // search text
    // let searchBar = (
    //   <div>
    //     <input 
    //         type="text" 
    //         value={this.state.textFieldSearch}
    //         placeholder="search by filename ... "
    //         onChange={this.onTextFieldSearchHandler}
    //     />
    //   </div>
    // );

    // error message
    if (this.state.error) {
      error = (
        <div>
          <p>{error}</p>
        </div>
      )
    }

    // checkboxes
    // const searchMenuData = this.state.searchOptions;
    // let metadataSearchMenu;
    // let categoriesSearchMenu;
    // let visualObjectsMenu;
    
    // if (searchMenuData) {
       
      
    // }

    return (
      <Container fluid>
        <Row>{error}</Row>
        <Row className="border-bottom">
          <Col sm={3}>
            <h1 className="d-flex justify-content-center">Search Menu</h1>
          </Col>
          <Col sm={9}>
            <h1 className="d-flex justify-content-center">Gallery</h1>
          </Col>
        </Row> 
        <Row>
          <Col sm={3} className="border-right">
            <br></br>
              <ControlPanel mediaUnits={ this.state.mediaUnits }/>
            <br></br>
              <SearchMenu 
                  updateGallery={this.getGallery.bind(this)}
              />
          </Col>
          <Col sm={9}>
            <Gallery 
              mediaUnits={this.state.mediaUnits}
            />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default App;