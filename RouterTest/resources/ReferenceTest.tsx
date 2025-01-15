import { Component } from 'react';
import { Reference } from 'Router/router';

interface IProps {
    state: string;
    href: string;
    location: string;
}

export default class ReferenceTest extends Component<IProps, { location: string }> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            location: props.location,
        };
    }

    render() {
        return (
            <Reference
                state={this.props.state}
                href={this.props.href}
                location={this.state.location}
            >
                <a>link</a>
            </Reference>
        );
    }

    updateLocation(location: string): void {
        this.setState({ location });
    }
}
