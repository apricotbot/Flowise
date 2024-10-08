export default (err: Error) => {
    return {
        channel: `#kesem-flowise-alerts`,
        text: 'GENERAL-ERROR',
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `🚨 GENERAL ERROR 🚨`,
                    emoji: true,
                },
            },
            {
                type: 'divider',
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Date/Time:*\n${new Date().toUTCString()}`,
                    }
                ],
            },
            {
                type: 'divider',
            },
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: `\`\`\`${err.stack}\`\`\``
                    }
                ],
            },
            {
                type: 'divider',
            }
        ],
    };
}