// src/states/commentState.svelte.js

let commentsById = $state({}); // keys are recipe IDs, values are arrays of comments

const useCommentState = (recipeId) => {
    // Load comments for this recipe from localStorage
    if (typeof localStorage !== "undefined") {
        const stored = localStorage.getItem(`comments-${recipeId}`);
        if (stored && !commentsById[recipeId]) {
            commentsById[recipeId] = JSON.parse(stored);
        }
    }

    // Initialize if missing
    if (!commentsById[recipeId]) {
        commentsById[recipeId] = [];
    }

    return {
        get count() {
            return commentsById[recipeId].length;
        },
        get comments() {
            return commentsById[recipeId];
        },
        add: (comment) => {
            if (comment.trim() !== "") {
                commentsById[recipeId].push(comment);

                // Save to localStorage
                if (typeof localStorage !== "undefined") {
                    localStorage.setItem(
                        `comments-${recipeId}`,
                        JSON.stringify(commentsById[recipeId])
                    );
                }
            }
        },
    };
};

export { useCommentState };
