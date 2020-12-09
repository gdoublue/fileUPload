 function request({url,method='POST',data,headers={},requestList}) {
    return new Promise((resolve,reject) => {
        const xhr =new XMLHttpRequest();
        xhr.open(method,url)

        Object.keys(headers).forEach(key =>
            xhr.setRequestHeader(key, headers[key]) // 请求加头
        );
        // xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");//缺少这句，后台无法获取参数
        // xhr.setRequestHeader("Content-Type","application/json")
        // xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded")
        xhr.send(data)
        xhr.onload = e => {
            resolve({
                data: e.target.response
            });
        }
    })
}

