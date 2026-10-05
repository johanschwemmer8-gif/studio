import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ShopperPresentationController } from './shopper-presentation-controller';

describe('ShopperPresentationController canonical Ari conversation', () => {
    it('sends the shopper question to the runtime and renders the Ari response', async () => {
        const onSubmitConversationMessage = jest
            .fn()
            .mockResolvedValue('Ari response');

        render(
            <ShopperPresentationController
                standardExperience={({ openConversation }) => (
                    <button
                        type="button"
                        onClick={() => openConversation()}
                    >
                        Ask Ari
                    </button>
                )}
                conversationExperience={(
                    onMinimize,
                    start,
                    messages,
                    onSubmitMessage,
                ) => (
                    <div>
                        {messages.map((message, index) => (
                            <div
                                key={`${message.role}-${index}`}
                                data-testid={`message-${index}`}
                            >
                                {message.role}:{message.content}
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() =>
                                onSubmitMessage(
                                    'Which option suits my needs?',
                                )
                            }
                        >
                            Submit question
                        </button>
                    </div>
                )}
                comparisonExperience={() => <div>Compare</div>}
                suitabilityExperience={() => <div>Suitability</div>}
                exploreExperience={() => <div>Explore</div>}
                menuExperience={() => <div>Menu</div>}
                discoverExperience={() => <div>Discover</div>}
                onSubmitConversationMessage={
                    onSubmitConversationMessage
                }
            />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: 'Ask Ari' }),
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Submit question',
            }),
        );

        expect(
            screen.getByText(
                'user:Which option suits my needs?',
            ),
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(onSubmitConversationMessage).toHaveBeenCalledTimes(1);
        });

        expect(onSubmitConversationMessage).toHaveBeenCalledWith(
            'Which option suits my needs?',
            [
                {
                    role: 'user',
                    content: 'Which option suits my needs?',
                },
            ],
        );

        expect(
            await screen.findByText('model:Ari response'),
        ).toBeInTheDocument();
    });
});
