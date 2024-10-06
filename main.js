// 地図の初期化
const map = L.map('map').setView([36.57332724, 140.64191796], 13); // 東京駅周辺に初期位置を設定

// OSMタイルレイヤーを追加
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let startPoint = null;  // 出発地点の座標
let endPoint = null;    // 終着地点の座標
let routeLine = null;   // ルートラインの参照
let searchMarker = null;  // 検索結果のマーカー

// クリックイベントで出発地点と終着点を設定
map.on('click', function(e) {
    if (!startPoint) {
        startPoint = e.latlng;
        L.marker(startPoint).addTo(map).bindPopup("出発地点").openPopup();
    } else if (!endPoint) {
        endPoint = e.latlng;
        L.marker(endPoint).addTo(map).bindPopup("終着地点").openPopup();

        // 出発地点と終着地点が設定されたらルートを計算
        getRoute(startPoint, endPoint);
    }
});

// OSRM APIを使ってルートを取得して表示
function getRoute(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const route = data.routes[0];
            const routeCoordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

            // 既存のルートを消去（あれば）
            if (routeLine) {
                map.removeLayer(routeLine);
            }

            // ルートを表示
            routeLine = L.polyline(routeCoordinates, { color: 'blue', weight: 4 }).addTo(map);

            // ルートに合わせて地図の範囲を調整
            map.fitBounds(routeLine.getBounds());
        })
        .catch(error => {
            console.error('ルート計算に失敗しました', error);
        });
}

// 検索フォームの要素を取得
const searchBox = document.getElementById('search-box');
const searchButton = document.getElementById('search-button');

// 検索ボタンが押された時の処理
searchButton.addEventListener('click', function() {
    const query = searchBox.value;

    if (query) {
        searchLocation(query);
    }
});

// Nominatim APIを使って場所を検索
function searchLocation(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const result = data[0];  // 最初の検索結果を使う
                const lat = result.lat;
                const lon = result.lon;

                // 検索結果のマーカーを設定
                if (searchMarker) {
                    map.removeLayer(searchMarker);  // 以前の検索結果を削除
                }
                searchMarker = L.marker([lat, lon]).addTo(map).bindPopup(result.display_name).openPopup();

                // 地図の中心を検索結果に移動
                map.setView([lat, lon], 13);

                // 出発地点または終着点として使用できるようにする
                if (!startPoint) {
                    startPoint = L.latLng(lat, lon);
                    L.marker(startPoint).addTo(map).bindPopup("出発地点").openPopup();
                } else if (!endPoint) {
                    endPoint = L.latLng(lat, lon);
                    L.marker(endPoint).addTo(map).bindPopup("終着地点").openPopup();
                    getRoute(startPoint, endPoint);
                }
            } else {
                alert('結果が見つかりませんでした。');
            }
        })
        .catch(error => {
            console.error('検索に失敗しました', error);
        });
}

// 地図をリセットする機能（オプション）
function resetMap() {
    startPoint = null;
    endPoint = null;

    if (routeLine) {
        map.removeLayer(routeLine);
    }

    if (searchMarker) {
        map.removeLayer(searchMarker);
    }

    // すべてのマーカーを消去
    map.eachLayer(function(layer) {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    map.setView([35.6804, 139.7690], 13);  // 初期位置に戻す
}

