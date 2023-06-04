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

export const mapAgentGroup = (agentGroup) => {
  return {
    key: agentGroup.groupName,
    groupName: agentGroup.groupName,
    description: agentGroup.description,
    tags: agentGroup.tags.map(item => {
      return {
        name: item.name,
        value: item.value,
      }
    }),
  };
};

export const correlateAgentGroup = (agentGroup, old) => {
  return {
    ...agentGroup,
    agentCount: old ? old.agentCount : undefined,
    appliedConfigCount: old ? old.appliedConfigCount : undefined,
    appliedConfigs: old ? old.appliedConfigs : undefined,
  };
};

export const markAppliedAgentGroup = (agentGroup, appliedGroupNames) => {
  return {
    ...agentGroup,
    applied: appliedGroupNames.includes(agentGroup.groupName),
  };
};

export const mapConfig = (config) => {
  return {
    key: config.name,
    name: config.name,
    type: config.type,
    version: config.version,
    context: config.context,
    detail: config.detail,
  };
};

export const markAppliedConfig = (config, appliedConfigNames) => {
  return {
    ...config,
    applied: appliedConfigNames.includes(config.name),
  };
};

export const mapAgent = (agent) => {
  return {
    key: agent.agentId,
    agentType: agent.agentType,
    agentId: agent.agentId,

    // attributes
    version: agent.attributes.version,
    category: agent.attributes.category,
    ip: agent.attributes.ip,
    region: agent.attributes.region,
    zone: agent.attributes.zone,

    tags: agent.tags.map(it => `${it.name} = ${it.value}`).join(', '),
    runningStatus: agent.runningStatus,
    startupTime: agent.startupTime,
    interval: agent.interval,
  };
};
