
import { WebClient } from '@slack/web-api';
import errorMessage from './errorMessage';

const slackClient = new WebClient(process.env.SLACK_TOKEN);

const sendSlackMessage = (err: Error) => {
    if (process.env.NODE_ENV === 'production') {
        const message = errorMessage(err);
        slackClient.chat.postMessage(message).catch((err) => {
            console.log("failed to send slack msg due to\n", err);
        });
    }
};

export default sendSlackMessage;