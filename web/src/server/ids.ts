const hex = (uuid: string) => uuid.replace(/-/g, '').toLowerCase();

export const nexconnUserId = (uuid: string, isDemo: boolean) => `${isDemo ? 'demo' : 'u'}${hex(uuid)}`;
export const lobbyChannelId = (uuid: string) => `l${hex(uuid)}`;
export const podChannelId = (uuid: string) => `p${hex(uuid)}`;
