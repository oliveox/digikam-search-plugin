import React, { Component } from "react";
import CheckboxTree from "react-checkbox-tree";
import "react-checkbox-tree/lib/react-checkbox-tree.css";

import {
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdChevronRight,
  MdKeyboardArrowDown,
  MdAddBox,
  MdIndeterminateCheckBox,
  MdFolder,
  MdFolderOpen,
  MdInsertDriveFile
} from "react-icons/md";

type WidgetState = {
  checked: Array<any>,
  expanded: Array<any>
}

type WidgetProps = {
  checkHandler: (checked: Array<any>) => void,
  nodes: Array<any>
  onlyLeafCheckboxes: boolean
}

class WidgetTree extends Component<WidgetProps, WidgetState> {
  
  state = {
    checked: [],
    expanded: []
  };

  onCheckHandler = (checked: Array<any>) => {
    this.props.checkHandler(checked);
    this.setState({ checked });
  }

  onExpandHandler = (expanded: Array<any>) => {
    this.setState({ expanded });
  }

  render() {

    return (
        <CheckboxTree
          nodes={this.props.nodes}
          onlyLeafCheckboxes={this.props.onlyLeafCheckboxes}
          checked={this.state.checked}
          expanded={this.state.expanded}
          onCheck={checked => this.onCheckHandler(checked)}
          onExpand={expanded => this.onExpandHandler(expanded)}
          // onClick={this.props.clickHandler}
          icons={icons}
          showExpandAll
          expandOnClick
        />
    );
  }
}

const icons = {
  check: <MdCheckBox className="rct-icon rct-icon-check" />,
  uncheck: <MdCheckBoxOutlineBlank className="rct-icon rct-icon-uncheck" />,
  halfCheck: (
    <MdIndeterminateCheckBox className="rct-icon rct-icon-half-check" />
  ),
  expandClose: (
    <MdChevronRight className="rct-icon rct-icon-expand-close" />
  ),
  expandOpen: (
    <MdKeyboardArrowDown className="rct-icon rct-icon-expand-open" />
  ),
  expandAll: <MdAddBox className="rct-icon rct-icon-expand-all" />,
  collapseAll: (
    <MdIndeterminateCheckBox className="rct-icon rct-icon-collapse-all" />
  ),
  parentClose: <MdFolder className="rct-icon rct-icon-parent-close" />,
  parentOpen: <MdFolderOpen className="rct-icon rct-icon-parent-open" />,
  leaf: <MdInsertDriveFile className="rct-icon rct-icon-leaf-close" />
};

export default WidgetTree;
