$(document).ready(function(){

    var scrollContent = new iScroll('contentWrapper',{
        onBeforeScrollStart: function (e) {
        var target = e.target;
        while (target.nodeType != 1) target = target.parentNode;

        if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA'&& target.tagName != 'BUTTON')
          e.preventDefault();
        }
    });
    //$("#sidebar").hide();
    var scrollNav = new iScroll('navWrapper');
    document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

  //clear db
  localStorage.setItem("votedata_str",'');
  localStorage.setItem("connect",'');
  //ajax test
  var connect={server:"192.168.80.177",port:"3000"};
  localStorage.setItem("connect",JSON.stringify(connect));
  
  //登入界面
  jQuery("#loginnow").bind('click',connect,function(){

    //var formstr = $("form#voteform").serialize();
    var login = $("input[name='login']").val();
    var password = $("input[name='password']").val();
    connect.login = login;
    connect.password = password;
    save_data("login="+login+"&password="+password);
    //localStorage.setItem("votedata_str", "login="+login+"&password="+password);
    if(login == '' || password == ''){
      jQuery("p.intro").text("用户名和密码必须填写。").addClass('error').show('slow');
    }
    else{
      login_load(connect);
    }

  });

});


function login_load(connect){
  //login
  //alert("http://" + connect.server + ":" + connect.port +"/vote/api_opened/"+login+"/"+password);
  $.ajax({
    type:"GET",
    url:"http://" + connect.server + ":" + connect.port +"/vote/api_opened/"+connect.login+"/"+connect.password,
    error: function(jqXHR, textStatus, errorThrown){
      $("p.intro").text("登录失败,错误信息：无法与服务器 "+connect.server+" 正常通信。").addClass("error").show('slow');
    },
    success: function(doc){
      if(doc.status == 'success'){
        doc.data.login = connect.login;
        doc.data.password = connect.password;
        save_data("vote_id="+doc.data._id+"&vote_name="+doc.data.name+"&vote_vtype="+doc.data.vtype);
        loadhome(doc.data);
      }
      if(doc.status == 'error'){
        jQuery("p.intro").text("登录失败。原因："+doc.info).addClass('error').show('slow');
      }
    }
  });

}

// when data get ,then load home page.
function loadhome(data){

  //alert(data.login);
  localStorage.setItem("vote", data);
  //move login form
  jQuery("#login").remove();
  //show sidebar nav
  $("#sidebar").show();

//显示标题
  var template = _.template("<%= name%>");
  var htmlstr = template({name : data.name});
  jQuery("#pagetitle").text(htmlstr);

//显示基本信息
  var welcometmp = _.template("本次会议共有选票单<%= sectioncount%>个。");
  var welcomestr = welcometmp({sectioncount : data.sections.length});
  jQuery("p.intro").text(welcomestr);
 //显示开始按钮
  tplrender(jQuery("#votenow-tpl"));
  //加入一个计数器
  data.count = 0;
//绑定进入事件 ?? why not !!!
  //jQuery("#votenow").bind("click",data,load_ballot);
  load_sidenav(data);
  load_ballot(data);
}

function load_sidenav(data){
  tplrender(jQuery("#sidenav-tpl"),data);
}

//显示选票表单
function load_ballot(data) {
   
    var count = data.count;

    if(count > 0) {
      //绑定保存选票数据
      save_data($("form#voteform").serialize());
    }
    //count is a temp var to count the sections array ,so when the value is larger than the array length,STOP RENDER.
    if(count < data.sections.length){
      jQuery("#votenow").siblings('.ui-btn-inner').children('.ui-btn-text').text("下一单");
      data.sections[count].count = count;
      if(count > 0 ) jQuery("div#section-"+(count -1)).remove();
      if(data.vtype=="mark") {
        tplrender(jQuery("#marksection-tpl"),data.sections[count]);
      }
      if(data.vtype=="vote") {
        tplrender(jQuery("#votesection-tpl"),data.sections[count]);
        jQuery("#contentScroller li.vote").bind("click",function(){
          if($(this).children("input").attr("checked") == "checked"){
            $(this).children("input").removeAttr("checked");
            $(this).removeClass("active");
          }else{
            $(this).children("input").attr("checked","checked");
            $(this).addClass("active");
          }
          
        });
      }
      data.count +=1;
    }else{
      jQuery("#votenow").parent('.ui-btn-up-c').remove();
      tplrender(jQuery("#votesubmit-tpl"));
      jQuery("#votesubmit").bind("click",post_form(function(msg){
        //alert(msg.status);
        tplrender(jQuery("#voteresult-tpl"),{"status":msg.status});
        //remove form
        jQuery("#voteform").remove();
        //clear db
        localStorage.setItem("votedata_str",'');
      }));

    }
}


function save_form_data(){

  var votedata_str = localStorage.getItem("votedata_str") + "&" + $("form#voteform").serialize();
  localStorage.setItem("votedata_str",votedata_str);
  console.log($("form#voteform").serialize()); 
}

function save_data(serialize_str){

  var votedata_str = localStorage.getItem("votedata_str") + "&" + serialize_str;
  localStorage.setItem("votedata_str",votedata_str);
  console.log($("form#voteform").serialize()); 
}

function post_form(callback){
   var connect = JSON.parse(localStorage.getItem("connect"));
   var votedata_str = "form=pad"+localStorage.getItem("votedata_str");
   if(votedata_str)  $.post("http://"+connect.server+":"+connect.port+"/answer/api_create", votedata_str,callback);
   else jQuery("p.intro").text("出错啦。");
}

//tpl_el: tpl_element like $("xxx_id")  data: json data to bind.
 function tplrender(tpl_el,data,callback) {
    var votenowtmp = _.template(tpl_el.text());
    var votenowstr = votenowtmp(data);
   tpl_el.after(votenowstr).parent();
   callback;
 }

