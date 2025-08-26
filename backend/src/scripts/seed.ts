import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('Starting database seeding...');

  // Create test users
  const testPassword = await hashPassword('password123');

  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      username: 'alice',
      displayName: 'Alice Johnson',
      passwordHash: testPassword,
      avatarUrl: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=fbbf24&color=000&size=128',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      username: 'bob',
      displayName: 'Bob Smith',
      passwordHash: testPassword,
      avatarUrl: 'https://ui-avatars.com/api/?name=Bob+Smith&background=3b82f6&color=fff&size=128',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      email: 'charlie@example.com',
      username: 'charlie',
      displayName: 'Charlie Brown',
      passwordHash: testPassword,
      avatarUrl: 'https://ui-avatars.com/api/?name=Charlie+Brown&background=10b981&color=fff&size=128',
    },
  });

  // Create friendships
  await prisma.friendship.upsert({
    where: {
      requesterId_addresseeId: {
        requesterId: user1.id,
        addresseeId: user2.id,
      },
    },
    update: {},
    create: {
      requesterId: user1.id,
      addresseeId: user2.id,
      status: 'ACCEPTED',
    },
  });

  await prisma.friendship.upsert({
    where: {
      requesterId_addresseeId: {
        requesterId: user2.id,
        addresseeId: user3.id,
      },
    },
    update: {},
    create: {
      requesterId: user2.id,
      addresseeId: user3.id,
      status: 'PENDING',
    },
  });

  // Create a conversation and some messages
  const conversation = await prisma.conversation.upsert({
    where: {
      participantOne_participantTwo: {
        participantOne: user1.id,
        participantTwo: user2.id,
      },
    },
    update: {},
    create: {
      participantOne: user1.id,
      participantTwo: user2.id,
      lastMessageAt: new Date(),
    },
  });

  // Create sample messages
  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        senderId: user1.id,
        content: 'Hey Bob! How are you doing?',
        messageType: 'TEXT',
        deliveredAt: new Date(),
        readAt: new Date(),
        isRead: true,
      },
      {
        conversationId: conversation.id,
        senderId: user2.id,
        content: 'Hi Alice! I\'m doing great, thanks for asking! 😊',
        messageType: 'TEXT',
        deliveredAt: new Date(),
        readAt: new Date(),
        isRead: true,
      },
      {
        conversationId: conversation.id,
        senderId: user1.id,
        content: 'That\'s wonderful to hear! Want to catch up over coffee sometime?',
        messageType: 'TEXT',
        deliveredAt: new Date(),
        isRead: false,
      },
    ],
  });

  // Create an invite code
  const inviteExpiry = new Date();
  inviteExpiry.setDate(inviteExpiry.getDate() + 7); // 7 days from now

  await prisma.inviteCode.create({
    data: {
      code: 'WELCOME1',
      createdBy: user1.id,
      expiresAt: inviteExpiry,
    },
  });

  logger.info('Database seeding completed successfully!');
  logger.info('Test users created:');
  logger.info('- alice@example.com / password123');
  logger.info('- bob@example.com / password123');
  logger.info('- charlie@example.com / password123');
  logger.info('- Invite code: WELCOME1');
}

main()
  .catch((e) => {
    logger.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
