import React from "react";
import { Button } from "react-bootstrap";

type State = {
    mediaUnits: Array<any>
    status: string
}
type Props = {
    mediaUnits: Array<any>
}

export default class ControlPanel extends React.Component <Props, State> {
    constructor (props: any) {
        super(props)

        this.state = {
            status: "",
            mediaUnits: props.mediaUnits
        }
        this.onFileManagerButtonClick = this.onFileManagerButtonClick.bind(this)
    }

    async onFileManagerButtonClick () {
        this.setState({status: "Opening File Manager ... "})

        const displayedFilepaths = this.state.mediaUnits.map((m: any) => m.filePath);
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(displayedFilepaths)
        }

        try {
            await fetch("http://localhost:3001/display", requestOptions);
            this.setState({status: ""})
        } catch (err) {
            console.error(err)
            this.setState({status: "Error opening File Manager"})
        }
    }

    render () {
        return (
            <div>
                <Button 
                    variant="dark"
                    onClick={this.onFileManagerButtonClick}
                >
                    Show in File Manager
                </Button>{' '}
                <p>{this.state.status}</p>
            </div>
        )
    }
}