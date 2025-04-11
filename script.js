// YouTube Playlist Video Statistics Fetcher
// This script fetches video statistics from a YouTube playlist using the YouTube Data API v3.
// It allows users to input their API key and playlist ID, and displays the video statistics in a grid format.
// The script uses DevExtreme components for UI elements and data grid.
(function() {
    const cachedApiKey = localStorage.getItem('apiKey') || '';
    const cachedPlaylistId = localStorage.getItem('playlistId') || '';

    $("#apiKeyInput").dxTextBox({
        placeholder: "Enter YouTube API Key",
        value: cachedApiKey,
        mode: "password",
        label: "YouTube API Key",
        width: "400px",
        onValueChanged: function(e) {
            localStorage.setItem('apiKey', e.value);
        }
    });

    $("#playlistIdInput").dxTextBox({
        placeholder: "Enter Playlist ID",
        label: "Playlist ID",
        value: cachedPlaylistId,
        width: "400px",
        onValueChanged: function(e) {
            localStorage.setItem('playlistId', e.value);
        }
    });

    $("#fetchButton").dxButton({
        text: "Fetch Videos",
        onClick: function() {
            const API_KEY = $("#apiKeyInput").dxTextBox("instance").option("value");
            const PLAYLIST_ID = $("#playlistIdInput").dxTextBox("instance").option("value");
            fetchAndDisplayVideos(API_KEY, PLAYLIST_ID);
        }
    });
})();


async function fetchPlaylistVideos(API_KEY, PLAYLIST_ID) {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${API_KEY}`);
    const data = await response.json();
    return data.items;
}

async function fetchPlaylistDetails(API_KEY, PLAYLIST_ID) {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${PLAYLIST_ID}&key=${API_KEY}`);
    const data = await response.json();
    return data.items[0].snippet.title;
}

async function fetchVideoDetails(API_KEY, videoIds) {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(',')}&key=${API_KEY}`);
    const data = await response.json();
    return data.items;
}

async function getVideosWithDetails(API_KEY, PLAYLIST_ID) {
    const playlistVideos = await fetchPlaylistVideos(API_KEY, PLAYLIST_ID);
    const videoIds = playlistVideos.map(video => video.snippet.resourceId.videoId);
    const videoDetails = await fetchVideoDetails(API_KEY, videoIds);

    return playlistVideos.map((video, index) => {
        const details = videoDetails.find(detail => detail.id === video.snippet.resourceId.videoId);
        return {
            count: index + 1,
            title: video.snippet.title,
            publishedAt: new Date(video.snippet.publishedAt).toLocaleDateString(),
            viewCount: details ? details.statistics.viewCount : 'N/A',
            likeCount: details ? details.statistics.likeCount : 'N/A',
            commentCount: details ? details.statistics.commentCount : 'N/A',
            videoId: video.snippet.resourceId.videoId,
            privacyStatus: details ? 'Public' : 'Private'
        };
    });
}

async function fetchAndDisplayVideos(API_KEY, PLAYLIST_ID) {
    const playlistTitle = await fetchPlaylistDetails(API_KEY, PLAYLIST_ID);
    document.getElementById('playlistHeader').innerText = `${playlistTitle}`;

    getVideosWithDetails(API_KEY, PLAYLIST_ID).then(videos => {
        $("#gridContainer").dxDataGrid({
            dataSource: videos,
            columns: [
                { dataField: "count", caption: "#" },
                { dataField: "title", caption: "Video Title" },
                { dataField: "publishedAt", caption: "Published Date", dataType: 'date' },
                { dataField: "viewCount", caption: "Views", dataType:'number' },
                { dataField: "likeCount", caption: "Likes", dataType:'number' },
                { dataField: "commentCount", caption: "Comments", dataType:'number' },
                { dataField: "videoId", caption: "Link", cellTemplate: function(container, options) {
                    container.append(`<a href="https://www.youtube.com/watch?v=${options.value}" target="_blank">youtu.be/${options.value}</a>`);
                }},
                { dataField: "privacyStatus", caption: "Privacy Status", groupIndex: 0, sortOrder: "desc",},
            ],
            export: {
                enabled: true,
                formats: ['xlsx']
            },
            summary: {
                totalItems: [{
                    column: "count",
                    summaryType: "count",
                }],
                groupItems: [{
                    summaryType: "count"
                }]
            },                    
            paging: {
                pageSize: 150
            }
        });
    });
}