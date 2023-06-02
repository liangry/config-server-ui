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

import {Modal, Table} from "antd";
import {FormattedMessage} from "react-intl";
import React, {useContext} from "react";
import {AgentsContext} from "../common/context";
import {mapTimestamp} from "../common/util";

export default () => {
  const {
    agentsVisible,
    agents,
    setAgentsVisible,
    setAgents,
  } = useContext(AgentsContext);

  const closeAgents = () => {
    setAgentsVisible(false);
    setAgents([]);
  };

  const agentColumns = [
    {
      key: 'agentType',
      dataIndex: 'agentType',
      title: <FormattedMessage id="agent_type" />,
    },
    {
      key: 'agentId',
      dataIndex: 'agentId',
      title: <FormattedMessage id="agent_id" />,
    },
    {
      key: 'version',
      dataIndex: 'version',
      title: <FormattedMessage id="agent_version" />,
    },
    {
      key: 'ip',
      dataIndex: 'ip',
      title: <FormattedMessage id="agent_ip" />,
    },
    {
      key: 'hostname',
      dataIndex: 'hostname',
      title: <FormattedMessage id="agent_hostname" />,
    },
    {
      key: 'region',
      dataIndex: 'region',
      title: <FormattedMessage id="agent_region" />,
    },
    {
      key: 'zone',
      dataIndex: 'zone',
      title: <FormattedMessage id="agent_zone" />,
    },
    {
      key: 'tags',
      dataIndex: 'tags',
      title: <FormattedMessage id="agent_tags" />,
    },
    {
      key: 'runningStatus',
      dataIndex: 'runningStatus',
      title: <FormattedMessage id="agent_running_status" />,
    },
    {
      key: 'startupTime',
      dataIndex: 'startupTime',
      title: <FormattedMessage id="agent_startup_time" />,
      render: (ts) => mapTimestamp(ts),
    },
    {
      key: 'interval',
      dataIndex: 'interval',
      title: <FormattedMessage id="agent_interval" />,
    },
  ];

  return (
    <Modal
      title={<FormattedMessage id="agent_title" />}
      width={1600}
      open={agentsVisible}
      onOk={closeAgents}
      onCancel={closeAgents}
    >
      <Table
        dataSource={agents}
        columns={agentColumns}
      />
    </Modal>
  );
};
