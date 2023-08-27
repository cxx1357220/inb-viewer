ffmpeg -i "所在目录的媒体文件名或者媒体文件的完整地址" -codec copy "导出文件的文件名或者完整地址"
版本
./ffmpeg-5.0.1.exe -i


关于切割文件
视频分为三种帧，
1、I帧
I帧又称帧内编码帧，是一种自带全部信息的独立帧，无需参考其他图像便可独立进行解码，可以简单理解为一张静态画面。视频序列中的第一个帧始终都是I帧，因为它是关键帧。

2、P帧
P帧又称帧间预测编码帧，需要参考前面的I帧才能进行编码。表示的是当前帧画面与前一帧（前一帧可能是I帧也可能是P帧）的差别。解码时需要用之前缓存的画面叠加上本帧定义的差别，生成最终画面。与I帧相比，P帧通常占用更少的数据位，但不足是，由于P帧对前面的P和I参考帧有着复杂的依耐性，因此对传输错误非常敏感。

3、B帧
B帧又称双向预测编码帧，也就是B帧记录的是本帧与前后帧的差别。也就是说要解码B帧，不仅要取得之前的缓存画面，还要解码之后的画面，通过前后画面的与本帧数据的叠加取得最终的画面。B帧压缩率高，但是对解码性能要求较高。

如下直接会导致帧切割损坏，因为有可能切到的不是关键帧i。
ffmpeg -ss 102 -to 199.55 -i D:\431960\2610181221\22-27-56.mp4 -y  -c copy  D:\431960\2610181221\new-22-27-56.mp4

要想准确切当前画面，只能解码切，但效率很慢
ffmpeg -ss 102 -to 199.55 -i D:\431960\2610181221\22-27-56.mp4 -y D:\431960\2610181221\new-22-27-56.mp4


不从当前画面切，而从关键帧切可以考虑以下两种，论坛上的-copyts 在win64 ffmpeg-5.0.1和5.1.2下毫无作用。不谈

第一种是accurate_seek和avoid_negative_ts
-accurate_seek
ffmpeg -ss 102 -to 199.55  -accurate_seek -i D:\431960\2610181221\22-27-56.mp4 -y  -c copy -avoid_negative_ts 1 D:\431960\2610181221\new-22-27-56.mp4

ffmpeg -ss 10 -t 15 -accurate_seek -i test.mp4 -codec copy -avoid_negative_ts 1 cut.mp4

第二种是segment_times，可以切片多个，切完后的视频还保留以前的时间轴，-reset_timestamps 1使时间戳归零，但其实还是不太准
ffmpeg.exe -i D:\431960\2610181221\22-27-56.mp4 -f segment -segment_times 00:00:06.165,00:00:14.293 -c copy -map 0 Out_%03d.mp4

ffmpeg.exe -i D:\431960\2610181221\22-27-56.mp4 -f segment -segment_times 00:01:00 -segment_format mp4 -reset_timestamps 1 -c copy  Out_%01d.mp4

提取关键帧

ffprobe -show_frames -select_streams v -of xml "D:\431960\2610181221\22-27-56.mp4" | findstr -n I > a.txt
//pts_time 为关键帧时间戳，示例视频为62.5s有一次帧type='I',所以切00:01:00s会切到62.5s