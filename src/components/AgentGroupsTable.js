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

import {Button, Divider, message, Popconfirm, Table} from "antd";
import {useContext, useEffect, useState} from "react";
import {interactive} from "../common/request";
import {FormattedMessage} from "react-intl";
import {
  AgentGroupContext,
  AgentGroupsContext,
  AgentsContext,
  AppliedConfigsContext,
  RootContext
} from "../common/context";
import AgentsModal from "./AgentsModal";
import AppliedConfigsModal from "./AppliedConfigsModal";
import AgentGroupModal from "./AgentGroupModal";
import {correlateAgentGroup, mapAgent, mapAgentGroup} from "../common/mapper";
import {mapTags} from "../common/util";

export default () => {
  const {root} = useContext(RootContext);
  const {
    colorPrimary,
    agentGroup,
    agentGroupVisible,
    setAgentGroup,
    setAgentGroupVisible,
  } = useContext(AgentGroupsContext);

  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [appliedConfigsVisible, setAppliedConfigsVisible] = useState(false);
  const [agents, setAgents] = useState([]);
  const [agentsVisible, setAgentsVisible] = useState(false);

  useEffect(() => {
    fetchDataSource();
  }, []);

  const fetchDataSource = () => {
    setLoading(true);
    interactive(root, `ListAgentGroups`, {}).then(async ([ok, statusCode, statusText, response]) => {
      setLoading(false);
      if (!ok) {
        message.error(`${statusCode} ${statusText}: ${response.message || 'unknown error'}`);
        return;
      }

      console.log(response.message);
      const data = response.agentGroups.map((item) => {
        const old = dataSource.find(it => it.groupName === item.groupName);
        return correlateAgentGroup(mapAgentGroup(item), old);
      });
      setDataSource(data);
    });
  };

  const fetchAgentGroupSummaries = async (key, force) => {
    if (!force) {
      if (dataSource.find(it => it.key === key).agentCount !== undefined &&
        dataSource.find(it => it.key === key).appliedConfigCount !== undefined) {
        return;
      }
    }
    const params = {
      groupName: key,
    };
    const [ok1, statusCode1, statusText1, response1] = await interactive(root, `ListAgents`, params);
    if (!ok1) {
      console.log(`fetch agents summary: ${statusCode1} ${statusText1}: ${response1.message || 'unknown error'}`);
      return;
    }
    const [ok2, statusCode2, statusText2, response2] = await interactive(root, `GetAppliedConfigsForAgentGroup`, params);
    if (!ok2) {
      console.log(`fetch applied configs summary: ${statusCode2} ${statusText2}: ${response2.message || 'unknown error'}`);
      return;
    }
    const data = dataSource.map(it => {
      return {
        ...it,
        agentCount: (it.key === key) ? response1.agents.length : it.agentCount,
        appliedConfigCount: (it.key === key) ? response2.configNames.length : it.appliedConfigCount,
        appliedConfigs: (it.key === key) ? response2.configNames : it.appliedConfigs,
      };
    });
    setDataSource(data);
  };

  const fetchAgents = (groupName) => {
    const params = {
      groupName,
    };
    interactive(root, `ListAgents`, params).then(async ([ok, statusCode, statusText, response]) => {
      if (!ok) {
        message.error(`${statusCode} ${statusText}: ${response.message || 'unknown error'}`);
        return;
      }
      if (response.agents.length === 0) {
        message.warning('Agent not found');
        return;
      }
      const data = response.agents.map((item) => mapAgent(item));
      console.log(data);
      setAgents(data);
      setAgentsVisible(true);
    });
  };

  const openAppliedConfigs = (groupName) => {
    setAgentGroup({
      groupName,
    });
    setAppliedConfigsVisible(true);
  };

  const getAgentGroup = (groupName) => {
    const params = {
      groupName,
    };
    interactive(root, `GetAgentGroup`, params).then(async ([ok, statusCode, statusText, response]) => {
      if (!ok) {
        message.error(`${statusCode} ${statusText}: ${response.message || 'unknown error'}`);
        return;
      }
      const data = mapAgentGroup(response.agentGroup);
      console.log(data);
      setAgentGroup(data);
      setAgentGroupVisible(true);
    });
  };

  const deleteAgentGroup = (groupName) => {
    const params = {
      groupName,
    };
    interactive(root, `DeleteAgentGroup`, params).then(async ([ok, statusCode, statusText, response]) => {
      if (!ok) {
        message.error(`${statusCode} ${statusText}: ${response.message || 'unknown error'}`);
        return;
      }
      message.success(`Agent group ${groupName} deleted`);
      fetchDataSource();
    });
  };

  const agentGroupColumns = [
    {
      key: 'groupName',
      dataIndex: 'groupName',
      title: <FormattedMessage id="group_name" />,
    },
    {
      key: 'description',
      dataIndex: 'description',
      title: <FormattedMessage id="group_description" />,
    },
    {
      key: 'tags',
      dataIndex: 'tags',
      title: <FormattedMessage id="group_tags" />,
      render: (tags) => mapTags(tags),
    },
    {
      key: 'agentCount',
      dataIndex: 'agentCount',
      title: <FormattedMessage id="group_agent_count" />,
      render: (value, record) => (
        <Button
          type="link"
          style={{
            paddingRight: 0,
            paddingLeft: 0,
            color: colorPrimary,
          }}
          onClick={() => fetchAgents(record.groupName)}
        >
          {value}
        </Button>
      ),
    },
    {
      key: 'appliedConfigCount',
      dataIndex: 'appliedConfigCount',
      title: <FormattedMessage id="group_applied_config_count" />,
      render: (value, record) => (
        <Button
          type="link"
          style={{
            paddingRight: 0,
            paddingLeft: 0,
            color: colorPrimary,
          }}
          onClick={() => {openAppliedConfigs(record.groupName)}}
        >
          {value > 0 ?
            `${value} [${record.appliedConfigs.join(', ')}]` :
            (value === 0 ?
              <FormattedMessage id="add_config" values={{ value }} /> :
              ''
            )
          }
        </Button>
      ),
    },
    {
      key: 'operate',
      title: <FormattedMessage id="operate" />,
      render: (record) => (
        <>
          <Button
            type="link"
            style={{
              paddingRight: 0,
              paddingLeft: 0,
              color: colorPrimary,
            }}
            onClick={() => getAgentGroup(record.groupName)}
          >
            <FormattedMessage id="open" />
          </Button>
          <Divider type="vertical" />
          <Popconfirm
            title={<FormattedMessage id="group_delete_confirm" />}
            onConfirm={() => deleteAgentGroup(record.groupName)}
            disabled={record.groupName === 'default'}
          >
            <Button
              type="link"
              style={{
                paddingRight: 0,
                paddingLeft: 0,
                color: record.groupName === 'default' ? '' : colorPrimary,
              }}
              disabled={record.groupName === 'default'}
            >
              <FormattedMessage id="delete" />
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <>
      <Table
        dataSource={dataSource}
        columns={agentGroupColumns}
        loading={loading}
        onRow={(record) => {
          return {
            onMouseEnter: () => fetchAgentGroupSummaries(record.key, false),
          };
        }}
      />
      <AgentsContext.Provider
        value={{
          agentsVisible,
          agents,
          setAgentsVisible,
          setAgents,
        }}
      >
        <AgentsModal />
      </AgentsContext.Provider>
      <AppliedConfigsContext.Provider
        value={{
          appliedConfigsVisible,
          setAppliedConfigsVisible,
          agentGroup,
          fetchAgentGroupSummaries,
        }}
      >
        <AppliedConfigsModal />
      </AppliedConfigsContext.Provider>
      <AgentGroupContext.Provider
        value={{
          agentGroupVisible,
          agentGroup,
          setAgentGroupVisible,
          setAgentGroup,
          fetchDataSource,
        }}
      >
        <AgentGroupModal />
      </AgentGroupContext.Provider>
    </>
  );
};
