import { ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketCoreService } from 'src/sockets/sockets-core.service';
import { SocketStateService } from 'src/sockets/sockets-state.service';
import { SocketsGateway } from 'src/sockets/sockets.gateway';
import extractRecievers from 'src/utils/extractRecievers';
import { ChatService } from './chat.service';
import { MessageGetDto } from './dto/message-get.dto';
import { MessagePostDto } from './dto/message-post.dto';
import { ChatDialogEntity } from './entities/chat-dialog.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';

@ApiTags('Chat-ws')
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
@UseInterceptors(ClassSerializerInterceptor)
export class ChatGateway extends SocketsGateway {
  constructor(
    readonly chatService: ChatService,
    readonly socketService: SocketStateService,
    readonly socketCoreService: SocketCoreService,
  ) {
    super(socketService, socketCoreService);

    this.socketCoreService;
    this.socketService;
  }

  @SubscribeMessage('message')
  async handleNewMessage(
    @MessageBody() data: MessagePostDto & Pick<ChatDialogEntity, 'uuid'>,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<ChatMessageEntity>> {
    const userHash = this.socketService.getUserBySocketId(client.id);

    const [message, dialog] = await this.chatService.createMessage({
      userHash,
      ...data,
    });

    this.sendMessage({
      message,
      event: 'message',
      userHash: extractRecievers(dialog.participants),
    });

    return { event: 'message', data: message };
  }

  @SubscribeMessage('read-message')
  async readMessage(
    @MessageBody() data: MessageGetDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<ChatMessageEntity>> {
    const userHash = this.socketService.getUserBySocketId(client.id);

    const msg = await this.chatService.makeChatMessageReaded({
      userHash,
      ...data,
    });

    return { event: 'read-message', data: msg };
  }
}
