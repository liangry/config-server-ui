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
import {AppliedAgentGroupsContext, ConfigContext, ConfigsContext} from "../common/context";
import AppliedAgentGroupsModal from "./AppliedAgentGroupsModal";
import ConfigModal from "./ConfigModal";
import {useContext, useEffect, useState} from "react";
import {interactive} from "../common/request";
import {FormattedMessage} from "react-intl";
import {configTypes} from "../common/const";
import {mapConfig} from "../common/mapper";

export default () => {
  const {
    colorPrimary,
    config,
    configVisible,
    setConfig,
    setConfigVisible,
  } = useContext(ConfigsContext);

  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [appliedAgentGroupsVisible, setAppliedAgentGroupsVisible] = useState(false);

  useEffect(() => {
    fetchDataSource();
  }, []);

  const fetchDataSource = () => {
    setLoading(true);
    interactive(`ListConfigs`, {}).then(async ([ok, statusCode, statusText, response]) => {
      setLoading(false);
      if (!ok) {
        message.error(`${statusCode} ${statusText}: ${response.message || 'unknown error'}`);
        return;
      }

      console.log(response.message);
      const data = response.configDetails.map((item) => mapConfig(item));
      setDataSource(data);
    });
  };

  const fetchConfigSummaries = async (key, force) => {
    if (!force) {
      if (dataSource.find(it => it.key === key).appliedAgentGroupCount !== undefined) {
        return;
      }
    }
    const params = {
      configName: key,
    };
    const [ok, statusCode, statusText, response] = await interactive(`GetAppliedAgentGroups`, params);
    if (!ok) {
      console.log(`fetch applied agent groups summary: ${statusCode} ${statusText}: ${response.message || 'unknown error'}`);
      return;
    }
    const data = dataSource.map(it => {
      return {
        ...it,
        appliedAgentGroupCount: (it.key === key) ? response.agentGroupNames.length : it.appliedAgentGroupCount,
        appliedAgentGroups: (it.key === key) ? response.agentGroupNames : it.appliedAgentGroups,
      };
    });
    setDataSource(data);
  };

  const openAppliedAgentGroups = (name) => {
    setConfig({
      name,
    });
    setAppliedAgentGroupsVisible(true);
  };

  const getConfig = (configName) => {
    const params = {
      configName,
    };
    interactive(`GetConfig`, params).then(async ([ok, statusCode, statusText, response]) => {
      if (!ok) {
        message.error(`${statusCode} ${statusText}: ${response.message || 'unknown error'}`);
        return;
      }
      const data = mapConfig(response.configDetail);
      console.log(data);
      setConfig(data);
      setConfigVisible(true);
    });
  };

  const deleteConfig = (configName) => {
    const params = {
      configName,
    };
    interactive(`DeleteConfig`, params).then(async ([ok, statusCode, statusText, response]) => {
      if (!ok) {
        message.error(`${statusCode} ${statusText}: ${response.message || 'unknown error'}`);
        return;
      }
      message.success(`Config ${configName} deleted`);
      fetchDataSource();
    });
  };

  const configColumns = [
    {
      key: 'name',
      dataIndex: 'name',
      title: <FormattedMessage id="config_name" />,
    },
    {
      key: 'type',
      dataIndex: 'type',
      title: <FormattedMessage id="config_type" />,
      render: (v) => v !== undefined ? <FormattedMessage id={`${configTypes[v]}`} /> : '',
    },
    {
      key: 'appliedAgentGroupCount',
      dataIndex: 'appliedAgentGroupCount',
      title: <FormattedMessage id="config_applied_group_count" />,
      render: (value, record) => (
        <Button
          type="link"
          style={{
            paddingRight: 0,
            paddingLeft: 0,
            color: colorPrimary,
          }}
          onClick={() => {openAppliedAgentGroups(record.name)}}>
          {value > 0 ?
            `${value} [${record.appliedAgentGroups.join(', ')}]` :
            (value === 0 ?
              <FormattedMessage id="add_group" values={{ value }} /> :
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
            onClick={() => getConfig(record.name)}>
            <FormattedMessage id="open" />
          </Button>
          <Divider type="vertical" />
          <Popconfirm
            title={<FormattedMessage id="config_delete_confirm" />}
            onConfirm={() => deleteConfig(record.name)}
          >
            <Button
              type="link"
              style={{
                paddingRight: 0,
                paddingLeft: 0,
                color: colorPrimary,
              }}
            >
              <FormattedMessage id="delete" />
            </Button>
          </Popconfirm>
        </>
      ),
    }
  ];

  return (
    <>
      <Table
        dataSource={dataSource}
        columns={configColumns}
        loading={loading}
        onRow={(record) => {
          return {
            onMouseEnter: () => fetchConfigSummaries(record.key, false),
          };
        }}
      />
      <AppliedAgentGroupsContext.Provider
        value={{
          appliedAgentGroupsVisible,
          setAppliedAgentGroupsVisible,
          config,
          fetchConfigSummaries,
        }}
      >
        <AppliedAgentGroupsModal />
      </AppliedAgentGroupsContext.Provider>
      <ConfigContext.Provider
        value={{
          configVisible,
          config,
          setConfigVisible,
          setConfig,
          fetchDataSource,
        }}
      >
        <ConfigModal />
      </ConfigContext.Provider>
    </>
  );
};
