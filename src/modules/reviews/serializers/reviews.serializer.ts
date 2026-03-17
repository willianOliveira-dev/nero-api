
export type RawReview = {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    variantPurchased: string | null;
    isVerifiedPurchase: boolean;
    likesCount: number;
    createdAt: Date;
    user?: {
        id: string;
        name: string;
        image: string | null;
    } | null;
    media?: {
        type: 'image' | 'video';
        imageUrl: string;
        thumbnailUrl: string | null;
        duration: string | null;
    }[] | null;
};

export function serializeReview(review: RawReview, likedByMe = false) {
    return {
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        variant: review.variantPurchased,
        isVerified: review.isVerifiedPurchase,
        createdAt: review.createdAt,
        user: review.user ? {
            id: review.user.id,
            name: review.user.name,
            avatar: review.user.image
        } : null,
        likes: {
            count: review.likesCount,
            likedByMe
        },
        media: (review.media ?? []).map(m => ({
            type: m.type,
            url: m.imageUrl,
            thumbnail: m.thumbnailUrl,
            duration: m.duration
        }))
    };
}

export function serializeReviewList(reviews: RawReview[], userLikedIds: Set<string>) {
    return reviews.map(r => serializeReview(r, userLikedIds.has(r.id)));
}
