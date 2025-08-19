from django import template
from django.utils.safestring import mark_safe
import re

register = template.Library()

@register.filter
def markdown(value):
    """
    简单的Markdown解析器，支持常用的Markdown语法
    """
    if not value:
        return ""
    
    # 转换为字符串
    text = str(value)
    
    # 处理代码块（```）
    def replace_code_blocks(match):
        code = match.group(1).strip()
        language = match.group(2) if match.group(2) else ''
        return f'<pre><code class="language-{language}">{code}</code></pre>'
    
    # 先处理代码块，避免其内容被其他规则影响
    text = re.sub(r'```(\w+)?\n(.*?)\n```', lambda m: f'<pre><code class="language-{m.group(1) or ""}">{m.group(2)}</code></pre>', text, flags=re.DOTALL)
    
    # 处理行内代码
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    
    # 处理标题
    text = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', text, flags=re.MULTILINE)
    text = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', text, flags=re.MULTILINE)
    text = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', text, flags=re.MULTILINE)
    text = re.sub(r'^#### (.*?)$', r'<h4>\1</h4>', text, flags=re.MULTILINE)
    text = re.sub(r'^##### (.*?)$', r'<h5>\1</h5>', text, flags=re.MULTILINE)
    text = re.sub(r'^###### (.*?)$', r'<h6>\1</h6>', text, flags=re.MULTILINE)
    
    # 处理粗体
    text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'__(.*?)__', r'<strong>\1</strong>', text)
    
    # 处理斜体
    text = re.sub(r'\*(.*?)\*', r'<em>\1</em>', text)
    text = re.sub(r'_(.*?)_', r'<em>\1</em>', text)
    
    # 处理删除线
    text = re.sub(r'~~(.*?)~~', r'<del>\1</del>', text)
    
    # 处理链接
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2" target="_blank">\1</a>', text)
    
    # 处理图片
    text = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', r'<img src="\2" alt="\1" class="img-fluid" />', text)
    
    # 处理引用
    text = re.sub(r'^> (.*?)$', r'<blockquote>\1</blockquote>', text, flags=re.MULTILINE)
    
    # 处理无序列表
    lines = text.split('\n')
    in_list = False
    result_lines = []
    
    for line in lines:
        if re.match(r'^[-*+] ', line):
            if not in_list:
                result_lines.append('<ul>')
                in_list = True
            list_item = re.sub(r'^[-*+] (.*)', r'<li>\1</li>', line)
            result_lines.append(list_item)
        else:
            if in_list:
                result_lines.append('</ul>')
                in_list = False
            result_lines.append(line)
    
    if in_list:
        result_lines.append('</ul>')
    
    text = '\n'.join(result_lines)
    
    # 处理有序列表
    lines = text.split('\n')
    in_ordered_list = False
    result_lines = []
    
    for line in lines:
        if re.match(r'^\d+\. ', line):
            if not in_ordered_list:
                result_lines.append('<ol>')
                in_ordered_list = True
            list_item = re.sub(r'^\d+\. (.*)', r'<li>\1</li>', line)
            result_lines.append(list_item)
        else:
            if in_ordered_list:
                result_lines.append('</ol>')
                in_ordered_list = False
            result_lines.append(line)
    
    if in_ordered_list:
        result_lines.append('</ol>')
    
    text = '\n'.join(result_lines)
    
    # 处理水平分割线
    text = re.sub(r'^---$', r'<hr>', text, flags=re.MULTILINE)
    text = re.sub(r'^\*\*\*$', r'<hr>', text, flags=re.MULTILINE)
    
    # 处理换行符
    text = text.replace('\n\n', '</p><p>')
    text = text.replace('\n', '<br>')
    
    # 添加段落标签
    if text and not text.startswith('<'):
        text = '<p>' + text + '</p>'
    
    # 清理多余的空段落
    text = re.sub(r'<p>\s*</p>', '', text)
    text = re.sub(r'<p>(<h[1-6]>.*?</h[1-6]>)</p>', r'\1', text)
    text = re.sub(r'<p>(<ul>.*?</ul>)</p>', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'<p>(<ol>.*?</ol>)</p>', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'<p>(<blockquote>.*?</blockquote>)</p>', r'\1', text)
    text = re.sub(r'<p>(<hr>)</p>', r'\1', text)
    text = re.sub(r'<p>(<pre>.*?</pre>)</p>', r'\1', text, flags=re.DOTALL)
    
    return mark_safe(text)

@register.filter
def is_markdown(content):
    """
    检测内容是否可能是Markdown格式
    """
    if not content:
        return False
    
    markdown_indicators = [
        r'^#{1,6}\s',  # 标题
        r'\*\*.*?\*\*',  # 粗体
        r'\[.*?\]\(.*?\)',  # 链接
        r'^[-*+]\s',  # 列表
        r'^\d+\.\s',  # 有序列表
        r'```',  # 代码块
        r'`[^`]+`',  # 行内代码
        r'^>\s',  # 引用
    ]
    
    content_str = str(content)
    for pattern in markdown_indicators:
        if re.search(pattern, content_str, re.MULTILINE):
            return True
    
    return False