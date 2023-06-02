// Copyright 2023 iLogtail Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {FormattedMessage} from "react-intl";
import {Checkbox, message, Modal, Table} from "antd";
import React, {useContext, useState} from "react";
import {AgentGroupOptionsContext} from "../common/context";
import {interactive} from "../common/request";

export default () => {
  const {
    agentGroupOptionsVisible,
    agentGroupOptions,
    setAgentGroupOptionsVisible,
    setAgentGroupOptions,
    config,
    fetchAppliedAgentGroups,
  } = useContext(AgentGroupOptionsContext);

  const [agentGroupsBuffer, setAgentGroupsBuffer] = useState([]);

  const toggleAgentOption = (target) => {
    if (agentGroupsBuffer.includes(target)) {
      setAgentGroupsBuffer(agentGroupsBuffer.filter(item => item !== target));
    } else {
      const buffer = [
        ...agentGroupsBuffer,
        target,
      ];
      setAgentGroupsBuffer(buffer);
    }
  };

  const closeAgentGroupOptions = () => {
    setAgentGroupOptionsVisible(false);
    setAgentGroupOptions([]);
    setAgentGroupsBuffer([]);
  };

  const applyAgentGroups = async () => {
    if (agentGroupsBuffer.length === 0) {
      closeAgentGroupOptions();
      return;
    }
    const requests = agentGroupsBuffer.map(groupName => {
      return interactive('ApplyConfigToAgentGroup', {
        groupName,
        configName: config.name,
      });
    });
    // res: [[ok, statusCode, statusText, response], ...]
    const res = await Promise.all(requests);
    if (res.some(it => !it[0])) {
      const err = res.find(it => !it[0]);
      message.error(`${err[1]} ${err[2]}: ${err[3].message || 'unknown error'}`);
      return;
    }
    console.log(res.map(it => it[3].message));
    message.success(`Apply agent group to config ${config.name} success`);
    closeAgentGroupOptions();
    fetchAppliedAgentGroups(config.name);
  };

  const agentGroupOptionColumns = [
    {
      key: 'groupName',
      dataIndex: 'groupName',
      title: <FormattedMessage id="group_name" />,
    },
    {
      key: 'operate',
      title: <FormattedMessage id="select" />,
      render: (record) => (
        <Checkbox
          onChange={() => {toggleAgentOption(record.groupName)}}
          checked={record.applied || agentGroupsBuffer.includes(record.groupName)}
          disabled={record.applied}
        />
      ),
    },
  ];

  return (
    <Modal
      title={<FormattedMessage id="group_option_title" values={{ configName: config.name }} />}
      width={800}
      open={agentGroupOptionsVisible}
      onOk={applyAgentGroups}
      onCancel={closeAgentGroupOptions}
    >
      <Table
        dataSource={agentGroupOptions}
        columns={agentGroupOptionColumns}
      />
    </Modal>
  );
};
