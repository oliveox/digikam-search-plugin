import React from "react"
import CheckboxTree from '../CheckBoxTree/CheckBoxTree'

type Props = {
    updateGallery: Function
}

type SearchTypes = {
    metadata: Array<any>,
    categories: Array<any>,
    visualObjects: Array<any>,  
}

type State = {
    textFieldSearch: string,
    searchOptions: SearchTypes
    checkedMetadata: Array<any>,
    checkedCategories: Array<any>,
    checkedVisualObjects: Array<any>,
    updateGallery: Function
}

export default class SearchMenu extends React.Component <Props, State> {
    constructor (props: any) {
        super (props)
        this.state = {
            updateGallery: props.getGallery,
            searchOptions: { metadata: [], categories: [], visualObjects: [] },
            checkedMetadata: [],
            checkedCategories: [],
            checkedVisualObjects: [],
            textFieldSearch: ""
        }

        this.onCategorySearchHandler = this.onCategorySearchHandler.bind(this)
        this.onMetadataSearchHandler = this.onMetadataSearchHandler.bind(this)
        this.onVisualObjectsSearchHandler = this.onVisualObjectsSearchHandler.bind(this)
        this.onTextFieldSearchHandler = this.onTextFieldSearchHandler.bind(this)
    }

    componentDidMount () {
        fetch(`http://${process.env.REACT_APP_IP}:3001/menu`)
        .then(res => res.json())
        .then(res => {
            this.setState({
                searchOptions: res
            })
        })
        .catch(console.error)
    }

    onTextFieldSearchHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        const searchTerm = event.target.value;
        this.setState({textFieldSearch: searchTerm}, () => this.state.updateGallery());
    }

    onMetadataSearchHandler = (checked: Array<any>) => {
        this.setState({checkedMetadata: checked}, () => this.state.updateGallery());
}
    
    onCategorySearchHandler = (checked: Array<any>) => {
        this.setState({checkedCategories: checked}, () => this.state.updateGallery());
    }
    
    onVisualObjectsSearchHandler = (checked: Array<any>) => {
        this.setState({checkedVisualObjects: checked}, () => this.state.updateGallery());
    }

    render () {

        let {
            searchOptions
        } = this.state

        return (
            <React.Fragment>

            <div>
                <input 
                    type="text" 
                    value={this.state.textFieldSearch}
                    placeholder="search by filename ... "
                    onChange={this.onTextFieldSearchHandler}
                />
                <br></br>
            </div>

            {searchOptions?.metadata.length ? 
            (
            <React.Fragment>
                <h4>Metadata</h4>
                <CheckboxTree 
                    nodes={searchOptions.metadata} 
                    onlyLeafCheckboxes={true}
                    checkHandler={this.onMetadataSearchHandler}
                />
            </React.Fragment>
            ) 
            : 
            null
            }

            {searchOptions?.categories.length ?
            (
            <React.Fragment>
                <h4>Categories</h4>
                <CheckboxTree 
                    nodes={searchOptions.categories} 
                    onlyLeafCheckboxes={false}
                    checkHandler={this.onCategorySearchHandler}
                />
            </React.Fragment>
            ) 
            : 
            null
            }

            {searchOptions?.visualObjects.length ? 
            (
            <React.Fragment>
                <h4>Objects</h4>
                <CheckboxTree 
                    nodes={searchOptions.visualObjects} 
                    onlyLeafCheckboxes={false}
                    checkHandler={this.onVisualObjectsSearchHandler}
                />
            </React.Fragment>
            ) 
            : 
            null
            }   
        </React.Fragment>
        )
    }
}