// import type {PlasmoMessaging} from "@plasmohq/messaging"
// import {Kimi} from "~libs/chatbot/kimi";
// import {ConversationResponse, ResponseMessageType} from "~libs/open-ai/open-ai-interface";
// import {ChatError, ErrorCode} from "~utils/errors";
//
// const handler: PlasmoMessaging.PortHandler = async (req, res) => {
//     Logger.log(req)
//     const {conversationId, text, rid} = req.body
//
//     const myHeaders = new Headers();
//     // myHeaders.append("authorization", "Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ1c2VyLWNlbnRlciIsImV4cCI6MTcxMzMzMzkxNCwiaWF0IjoxNzEzMzMzMDE0LCJqdGkiOiJjb2ZtNjVoa3FxNHR0cmozbGowZyIsInR5cCI6ImFjY2VzcyIsInN1YiI6ImNvMzkzOXVjcDdmY3QwdmE0b2NnIiwic3BhY2VfaWQiOiJjbzM5Mzl1Y3A3ZmN0MHZhNG9jMCIsImFic3RyYWN0X3VzZXJfaWQiOiJjbzM5Mzl1Y3A3ZmN0MHZhNG9iZyJ9.4SyiCzUhkGXxhIfuDwdQxcGSUsbPqDAj7hAqWZ-m-snHaJlRvVsudDv2JsZYi8Gm6iAKIEA8selxnJK5WLbciQ");
//     myHeaders.append("content-type", "application/json");
//     myHeaders.append("origin", "https://kimi.moonshot.cn");
//     myHeaders.append("r-timezone", "Asia/Shanghai");
//     myHeaders.append("referer", "https://kimi.moonshot.cn/chat/" + conversationId);
//     // myHeaders.append("x-traffic-id", "co3939ucp7fct0va4ocg");
//
//     const accessToken =  await Kimi.getAccessToken()
//
//     if(accessToken) {
//         myHeaders.append("Authorization", `Bearer ${accessToken}`)
//     }
//
//     const raw = JSON.stringify({
//         "messages": [
//             {
//                 "role": "user",
//                 "content": text
//             }
//         ],
//         "refs": [],
//         "use_search": true
//     });
//
//     // fetch(`https://kimi.moonshot.cn/api/chat/${conversationId}/completion/stream`, {
//     //     method: "POST",
//     //     headers: myHeaders,
//     //     body: raw,
//     //     redirect: "follow"
//     // })
//     //     .then((response) => response.text())
//     //     .then((result) => Logger.log(result))
//     //     .catch((error) => console.error(error));
//     fetch(`https://kimi.moonshot.cn/api/chat/${conversationId}/completion/stream`, {
//         method: "POST",
//         headers: myHeaders,
//         body: raw,
//         redirect: "follow"
//     })
//         .then(response => {
//             const stream = response.body;
//             const reader = stream.getReader();
//
//             if (!response.ok) {
//                 res.send({
//                     rid,
//                     data: new ConversationResponse({
//                         conversation_id: conversationId,
//                         message_type: ResponseMessageType.ERROR,
//                         error: new ChatError(ErrorCode.CONVERSATION_LIMIT)
//                     })
//                 })
//
//                 return
//             }
//
//             let messageId  = ""
//             let groupId = ""
//             let outputText = ""
//
//             function readStream() {
//                 reader.read().then(async ({done, value}) => {
//                     if (done) {
//                         return;
//                     }
//
//                     const enc = new TextDecoder("utf-8");
//                     const str = enc.decode(value.buffer);
//
//
//                     for (const line of str.split("\n")) {
//                         let raw = line.replace("data: ", "").replace("\n", "");
//
//                         if (raw !== "") {
//                             try {
//                                 const {event, content, text, id, group_id}  = JSON.parse(raw);
//
//                                 if(event === "cmpl") {
//                                     messageId = id
//                                     groupId = group_id
//                                     outputText += text
//
//                                     res.send({
//                                         rid,
//                                         data: new ConversationResponse({
//                                             conversation_id: conversationId,
//                                             message_type: ResponseMessageType.GENERATING,
//                                             message_text: outputText,
//                                             message_id: messageId
//                                         })
//                                     })
//                                 } else if (event === "ping") {
//
//                                 } else if (event === "all_done") {
//                                     res.send({
//                                         rid,
//                                         data: new ConversationResponse({
//                                             conversation_id: conversationId,
//                                             message_type: ResponseMessageType.DONE,
//                                             message_text: outputText,
//                                             message_id: messageId
//                                         })
//                                     })
//                                 }
//                             } catch (e) {
//                                 Logger.log(e)
//                             }
//                         }
//                     }
//                     readStream();
//                 });
//             }
//             readStream();
//         }).catch((error) => {
//             res.send({
//                 rid,
//                 data: new ConversationResponse({
//                     conversation_id: conversationId,
//                     message_type: ResponseMessageType.ERROR,
//                     error: new ChatError(ErrorCode.UNKNOWN_ERROR)
//                 })
//             })
//     });
// }
//
// export default handler
