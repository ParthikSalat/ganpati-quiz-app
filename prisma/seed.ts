import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const questions = [
    {
        questionText: 'What is the most popular type of Ganpati idol?',
        options: ['Clay', 'Plaster of Paris', 'Metal'],
        correctAnswer: 'Clay',
        points: 10,
    },
    {
        questionText: 'In which Indian state is the Ganpati festival most widely celebrated?',
        options: ['Gujarat', 'Maharashtra', 'Karnataka'],
        correctAnswer: 'Maharashtra',
        points: 10,
    },
    {
        questionText: 'What is the traditional sweet offered to Lord Ganesha?',
        options: ['Peda', 'Modak', 'Jalebi'],
        correctAnswer: 'Modak',
        points: 10,
    },
];

async function main() {
    console.log('Start seeding...');
    for (const q of questions) {
        await prisma.question.create({
            data: q,
        });
    }
    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });