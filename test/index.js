import express from 'express';
import http from 'http';
var io = require('socket.io-client');
/*
describe('Get Add User Test', () => {
  it('should return 200', done => {
    var http=require('http');
    var querystring=require('querystring');
    var data={
      username: Math.random()*10000,
      nickname:'123',
      password:'123',
      userImage:'123',
      location:'123'
    };
    var content=querystring.stringify(data);
    var options={
      hostname:'localhost',
      port:3000,
      path:'/user/addUser?'+content,
      method:'GET'
    }
    //创建请求
    var req=http.request(options,function(res){
      console.log('STATUS:'+res.statusCode);
      console.log('HEADERS:'+JSON.stringify(res.headers));
      res.setEncoding('utf-8');
      res.on('data',function(chunk){
        console.log('数据片段分隔-----------------------\r\n');
        console.log(chunk);
      });
      res.on('end',function(){
        console.log('响应结束********');
      });
    });
    req.on('error',function(err){
      console.error(err);
    });
    req.end();
    done();
  });
});

describe('Post Add User Test', () => {
  it('should return 200', done => {
    var http=require('http');
    var querystring=require('querystring');
    //发送 http Post 请求  
    var postData=querystring.stringify({
      username: Math.random()*10000,
      nickname:'123',
      password:'123',
      userImage:'123',
      location:'123'
    });
    var options={
      hostname:'localhost',
      port:3000,
      path:'/user/addUser',
      method:'POST',
      header:{
        'Content-Type':'application/x-www.js-form-urlencoded',
        //'Content-Type':'application/x-www.js-form-urlencoded; charset=UTF-8',
        'Content-Length':Buffer.byteLength(postData)
      }
    }
    var req=http.request(options, function(res) {
      console.log('Status:',res.statusCode);
      console.log('headers:',JSON.stringify(res.headers));
      res.setEncoding('utf-8');
      res.on('data',function(chun){
        console.log('body分隔线---------------------------------\r\n');
        console.info(chun);
      });
      res.on('end',function(){
        console.log('No more data in response.********');
      });
    });
    req.on('error',function(err){
      console.error(err);
    });
    req.write(postData);
    req.end();
    //done();
  });
});

describe('Modify User Test', () => {
  it('should return 200', done => {
    var http=require('http');
    var querystring=require('querystring');
    var data={
      id: 2,
      nickname:'1234'
    };
    var content=querystring.stringify(data);
    var options={
      hostname:'localhost',
      port:3000,
      path:'/user/modifyNickname?'+content,
      method:'GET'
    }
    //创建请求
    var req=http.request(options,function(res){
      console.log('STATUS:'+res.statusCode);
      console.log('HEADERS:'+JSON.stringify(res.headers));
      res.setEncoding('utf-8');
      res.on('data',function(chunk){
        console.log('数据片段分隔-----------------------\r\n');
        console.log(chunk);
      });
      res.on('end',function(){
        console.log('响应结束********');
      });
    });
    req.on('error',function(err){
      console.error(err);
    });
    req.end();
    done();
  });
});*/

describe('Socket', () => {
  it('should return 200', done => {
    var socket = io.connect('http://localhost');
    socket.on('news', function (data) {
      console.log(data);
      socket.emit('other event', { my: 'data' });
    });

  });
});